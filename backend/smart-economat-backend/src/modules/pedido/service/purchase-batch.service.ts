import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PurchaseBatch } from '../purchase-batch.entity/purchase-batch.entity';
import {
  CreatePurchaseBatchDto,
  ConsolidatePurchaseBatchDto,
  UpdatePurchaseBatchDto,
  CancelPurchaseBatchDto,
} from '../dto/create-purchase-batch.dto';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { EstadoLote } from '../enums/estado-lote.enum';
import { buildPedidoAggregate } from '../../../application/pedido/pedido.factory';
import { ConfigService } from '@nestjs/config';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { In } from 'typeorm';
import { ProduccionService } from '../../receta/service/produccion.service';
import { CreateMissingStockBatchDto } from '../dto/create-missing-stock-batch.dto';
import { CreatePedidoUsuarioDto } from '../dto/pedido-usuario.dto';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { IncidenciaLinea } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';
import { reserveNextPedidoProveedorNumero } from '../utils/pedido-numero.util';
import {
  formatPurchaseBatchReferencia,
  reserveNextPurchaseBatchNumero,
} from '../utils/purchase-batch-numero.util';

type BatchCreationMode = 'approve' | 'consolidate';
type PedidoSemanticShape = Pedido & {
  numeroPedidoProveedor?: string;
  numeroPedidoVisible?: string;
  referenciaPedidoVisible?: string;
};

/**
 * Service for managing purchase batches (PurchaseBatch / lotes de compra).
 *
 * A PurchaseBatch groups one or more supplier Pedidos that were created or
 * consolidated together. This service handles creation, editing, approval,
 * cancellation, restoration, and status synchronisation for batches.
 *
 * All write operations run inside database transactions and roll back
 * automatically on failure.
 */
@Injectable()
export class PurchaseBatchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly produccionService: ProduccionService
  ) {}

  /**
   * Creates a new PurchaseBatch, automatically grouping product lines by supplier.
   *
   * Each unique supplier in `dto.lineas` gets its own child Pedido inside the
   * batch. All pedidos start in `POR_RECEPCIONAR` state and are tracked via the
   * movement audit log.
   *
   * @param dto - Product lines and optional observations for the batch
   * @param userId - ID of the authenticated user creating the batch
   * @returns The saved PurchaseBatch with all child pedidos loaded
   * @throws ConflictException if the batch could not be persisted
   */
  async createBatchOrder(
    dto: CreatePurchaseBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numeroLote = await reserveNextPurchaseBatchNumero(
        queryRunner.manager
      );

      const batch = queryRunner.manager.create(PurchaseBatch, {
        numeroGlobal: numeroLote,
        referencia: formatPurchaseBatchReferencia(numeroLote),
        usuarioId: userId,
        observaciones: dto.observaciones,
        estado: EstadoLote.PENDIENTE,
        modifiedBy: userId,
      });
      const savedBatch = await queryRunner.manager.save(PurchaseBatch, batch);

      const productIds = dto.lineas.map((l) => l.productoProveedorId);
      const productProviders = await queryRunner.manager.find(
        ProductoProveedor,
        {
          where: { id: In(productIds) },
          relations: ['proveedor'],
        }
      );

      const providerMap = new Map<string, typeof dto.lineas>();

      for (const linea of dto.lineas) {
        const pp = productProviders.find(
          (p) => p.id === linea.productoProveedorId
        );
        if (!pp) {
          throw new NotFoundException(
            `No se encontró el producto-proveedor con ID ${linea.productoProveedorId}`
          );
        }

        const pId = pp.proveedorId;
        if (!providerMap.has(pId)) {
          providerMap.set(pId, []);
        }
        providerMap.get(pId)!.push(linea);
      }

      const pedidosCreados: Pedido[] = [];

      for (const [proveedorId, lineas] of providerMap.entries()) {
        const createPedidoDto: CreatePedidoDto = {
          proveedorId,
          lineas,
        };

        const built = await buildPedidoAggregate(
          queryRunner.manager,
          createPedidoDto,
          userId,
          EstadoPedido.POR_RECEPCIONAR,
          () => this.calculateFechaEntrega()
        );

        built.pedido.numeroGlobal = await reserveNextPedidoProveedorNumero(
          queryRunner.manager
        );
        built.pedido.batchId = savedBatch.id;
        built.pedido.modifiedBy = userId;

        const savedPedido = await queryRunner.manager.save(
          Pedido,
          built.pedido
        );

        for (const pp of built.pedidoProductos) {
          await queryRunner.manager.insert(PedidoProducto, {
            pedidoId: savedPedido.id,
            productoProveedorId: pp.productoProveedorId,
            cantidad: pp.cantidad,
            precioUnitario: pp.precioUnitario,
            observaciones: pp.observaciones,
            modifiedBy: userId,
          });
        }

        pedidosCreados.push(savedPedido);

        await this.movimientoHelper.trackPedidoCreation(
          userId,
          savedPedido.id,
          `Pedido #${savedPedido.id} (Lote #${savedBatch.id})`
        );
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedBatch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(
        `Error al crear el lote de pedidos: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Creates a PurchaseBatch from a missing-stock analysis.
   *
   * Delegates to `buildPedidoUsuarioDtoFromMissingStock` to derive the required
   * product lines, then calls `createBatchOrder`.
   *
   * @param dto - List of recipe items to analyse for missing stock
   * @param userId - ID of the user initiating the order
   * @returns The created PurchaseBatch
   */
  async createBatchOrderFromMissingStock(
    dto: CreateMissingStockBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
    const pedidoUsuarioDto =
      await this.buildPedidoUsuarioDtoFromMissingStock(dto);

    return this.createBatchOrder(pedidoUsuarioDto, userId);
  }

  /**
   * Derives a `CreatePedidoUsuarioDto` by analysing which recipe ingredients are
   * below required stock levels and which supplier offers the cheapest option.
   *
   * Lines with sufficient stock or no valid supplier are silently skipped.
   * Quantities for the same ProductoProveedor are aggregated across items.
   *
   * @param dto - Recipe items and quantities to check
   * @returns A DTO ready to pass to `createBatchOrder`
   * @throws BadRequestException if no valid order lines can be derived
   */
  async buildPedidoUsuarioDtoFromMissingStock(
    dto: CreateMissingStockBatchDto
  ): Promise<CreatePedidoUsuarioDto> {
    const validation = await this.produccionService.validarMultiple({
      items: dto.items,
    });

    const groupedByProvider = new Map<
      string,
      Map<string, { productoProveedorId: string; cantidad: number }>
    >();

    for (const ingredient of validation.ingredients) {
      const missingQuantity = Number(
        (ingredient.requerido - ingredient.disponible).toFixed(3)
      );

      if (
        ingredient.isEnough ||
        !ingredient.cheapestProveedorId ||
        !ingredient.cheapestProductoProveedorId ||
        missingQuantity < 0.001
      ) {
        continue;
      }

      if (!groupedByProvider.has(ingredient.cheapestProveedorId)) {
        groupedByProvider.set(ingredient.cheapestProveedorId, new Map());
      }

      const providerLines = groupedByProvider.get(
        ingredient.cheapestProveedorId
      )!;
      const existing = providerLines.get(
        ingredient.cheapestProductoProveedorId
      );

      providerLines.set(ingredient.cheapestProductoProveedorId, {
        productoProveedorId: ingredient.cheapestProductoProveedorId,
        cantidad: Number(
          ((existing?.cantidad || 0) + missingQuantity).toFixed(3)
        ),
      });
    }

    const lineas = Array.from(groupedByProvider.values())
      .flatMap((providerLines) => Array.from(providerLines.values()))
      .filter((linea) => linea.cantidad >= 0.001);

    if (lineas.length === 0) {
      throw new BadRequestException(
        'No se encontraron líneas válidas para generar pedidos de faltantes.'
      );
    }

    return {
      observaciones: dto.observaciones,
      lineas,
    };
  }

  /**
   * Returns all PurchaseBatches ordered by creation date (newest first),
   * with pedidos, supplier, pedidoUsuario, and creator relations loaded.
   *
   * @returns Array of decorated PurchaseBatch entities
   */
  async findAll(): Promise<PurchaseBatch[]> {
    const batches = await this.dataSource.getRepository(PurchaseBatch).find({
      relations: [
        'pedidos',
        'pedidos.proveedor',
        'pedidos.pedidoUsuario',
        'usuario',
      ],
      order: { createdAt: 'DESC' },
    });

    return batches.map((batch) => this.decorateBatchIdentity(batch));
  }

  /**
   * Consolidates multiple PedidoUsuario records into a single PurchaseBatch.
   *
   * The consolidated pedidosUsuario transition to `CONSOLIDADO` state.
   *
   * @param dto - IDs of pedidosUsuario to consolidate and optional observations
   * @param userId - ID of the actor performing the consolidation
   * @returns The newly created PurchaseBatch
   */
  async consolidateExistingOrders(
    dto: ConsolidatePurchaseBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
    const uniquePedidoUsuarioIds = Array.from(new Set(dto.pedidoUsuarioIds));

    return this.createBatchFromPedidoUsuarioIds(
      uniquePedidoUsuarioIds,
      userId,
      dto.observaciones,
      'consolidate'
    );
  }

  /**
   * Approves a single PedidoUsuario by creating a PurchaseBatch from it.
   *
   * The pedidoUsuario transitions to `APROBADO` state.
   *
   * @param pedidoUsuarioId - UUID of the PedidoUsuario to approve
   * @param userId - ID of the actor performing the approval
   * @returns The created PurchaseBatch
   */
  async approvePedidoUsuario(
    pedidoUsuarioId: string,
    userId: string
  ): Promise<PurchaseBatch> {
    return this.createBatchFromPedidoUsuarioIds(
      [pedidoUsuarioId],
      userId,
      undefined,
      'approve'
    );
  }

  async updateBatchOrder(
    id: string,
    dto: UpdatePurchaseBatchDto,
    userId?: string
  ): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: ['pedidos', 'pedidos.pedidoProductos'],
      });

      if (!batch) {
        throw new NotFoundException(I18nHelper.getError('BATCH_NOT_FOUND'));
      }

      if (
        batch.pedidos.some(
          (pedido) =>
            [
              EstadoPedido.PENDIENTE_DE_APROBACION,
              EstadoPedido.POR_RECEPCIONAR,
            ].includes(pedido.estado) === false
        )
      ) {
        throw new BadRequestException(
          'Solo se pueden editar pedidos completos cuyos pedidos internos sigan pendientes.'
        );
      }

      const productIds = dto.lineas.map((linea) => linea.productoProveedorId);
      const productProviders = await queryRunner.manager.find(
        ProductoProveedor,
        {
          where: { id: In(productIds) },
          relations: ['proveedor'],
        }
      );

      const productProvidersById = new Map(
        productProviders.map((productProvider) => [
          productProvider.id,
          productProvider,
        ])
      );

      const existingPedidosByProvider = new Map(
        batch.pedidos.map((pedido) => [pedido.proveedorId || '', pedido])
      );
      const existingLines = batch.pedidos.flatMap(
        (pedido) => pedido.pedidoProductos || []
      );
      const existingLinesById = new Map(
        existingLines.map((line) => [line.id, line])
      );
      const retainedLineIds = new Set<string>();

      batch.observaciones = dto.observaciones;
      if (userId) {
        batch.modifiedBy = userId;
      }
      await queryRunner.manager.save(PurchaseBatch, batch);

      for (const linea of dto.lineas) {
        const productProvider = productProvidersById.get(
          linea.productoProveedorId
        );

        if (!productProvider) {
          throw new NotFoundException(
            `No se encontró el producto-proveedor con ID ${linea.productoProveedorId}`
          );
        }

        let targetPedido = existingPedidosByProvider.get(
          productProvider.proveedorId
        );

        if (!targetPedido) {
          targetPedido = await queryRunner.manager.save(
            Pedido,
            queryRunner.manager.create(Pedido, {
              numeroGlobal: await reserveNextPedidoProveedorNumero(
                queryRunner.manager
              ),
              usuarioId: batch.usuarioId,
              proveedorId: productProvider.proveedorId,
              batchId: batch.id,
              estado: EstadoPedido.POR_RECEPCIONAR,
              observaciones: dto.observaciones,
              fechaEntrega: this.calculateFechaEntrega(),
              costeTotal: 0,
              modifiedBy: userId,
            })
          );

          existingPedidosByProvider.set(
            productProvider.proveedorId,
            targetPedido
          );
        }

        const existingLine = linea.id
          ? existingLinesById.get(linea.id)
          : undefined;
        const precioVigente = productProvider.precioUnitario;

        if (precioVigente === null || precioVigente === undefined) {
          throw new ConflictException(
            `El producto proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente.`
          );
        }

        if (existingLine) {
          await queryRunner.manager.update(
            PedidoProducto,
            { id: existingLine.id },
            {
              pedidoId: targetPedido.id,
              productoProveedorId: productProvider.id,
              cantidad: linea.cantidad,
              precioUnitario: precioVigente,
              observaciones: existingLine.observaciones,
              modifiedBy: userId,
            }
          );

          retainedLineIds.add(existingLine.id);
          continue;
        }

        await queryRunner.manager.insert(PedidoProducto, {
          pedidoId: targetPedido.id,
          productoProveedorId: productProvider.id,
          cantidad: linea.cantidad,
          precioUnitario: precioVigente,
          modifiedBy: userId,
        });
      }

      const lineIdsToDelete = existingLines
        .filter((line) => !retainedLineIds.has(line.id))
        .map((line) => line.id);

      for (const lineId of lineIdsToDelete) {
        const hasReferences = await this.pedidoProductoHasReferences(
          queryRunner.manager,
          lineId
        );

        if (hasReferences) {
          throw new BadRequestException(
            `No se puede eliminar una línea del pedido porque ya está vinculada a recepciones o incidencias (${lineId.slice(0, 8)}).`
          );
        }
      }

      if (lineIdsToDelete.length > 0) {
        await queryRunner.manager.delete(PedidoProducto, {
          id: In(lineIdsToDelete),
        });
      }

      const batchPedidos = await queryRunner.manager.find(Pedido, {
        where: { batchId: batch.id },
      });

      for (const pedido of batchPedidos) {
        const pedidoProducts = await queryRunner.manager.find(PedidoProducto, {
          where: { pedidoId: pedido.id },
        });

        if (pedidoProducts.length === 0) {
          const hasRecepcionRefs = await this.pedidoHasRecepcionReferences(
            queryRunner.manager,
            pedido.id
          );

          if (hasRecepcionRefs) {
            await queryRunner.manager.update(
              Pedido,
              { id: pedido.id },
              {
                observaciones: dto.observaciones,
                costeTotal: 0,
                modifiedBy: userId,
              }
            );
          } else {
            await queryRunner.manager.delete(Pedido, { id: pedido.id });
          }
          continue;
        }

        const costeTotal = pedidoProducts.reduce(
          (sum, pedidoProduct) =>
            sum +
            Number(pedidoProduct.cantidad || 0) *
              Number(pedidoProduct.precioUnitario || 0),
          0
        );

        await queryRunner.manager.update(
          Pedido,
          { id: pedido.id },
          {
            observaciones: dto.observaciones,
            costeTotal,
            modifiedBy: userId,
          }
        );
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();

      return this.findOne(batch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al actualizar el pedido: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async acceptBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: ['pedidos'],
      });

      if (!batch) {
        throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
      }

      if (!batch.pedidos.length) {
        throw new BadRequestException(
          'El pedido no contiene pedidos internos para tramitar.'
        );
      }

      const invalidPedido = batch.pedidos.find(
        (pedido) =>
          [
            EstadoPedido.PENDIENTE_DE_APROBACION,
            EstadoPedido.POR_RECEPCIONAR,
          ].includes(pedido.estado) === false
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden aprobar pedidos completos cuyos pedidos internos sigan pendientes.'
        );
      }

      for (const pedido of batch.pedidos) {
        if (pedido.estado === EstadoPedido.PENDIENTE_DE_APROBACION) {
          pedido.estado = EstadoPedido.POR_RECEPCIONAR;
        }
        if (userId) {
          pedido.modifiedBy = userId;
        }
        await queryRunner.manager.save(Pedido, pedido);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();

      return this.findOne(batch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al aprobar el pedido: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async approveBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    return this.acceptBatchOrder(id, userId);
  }

  async restoreBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: [
          'pedidos',
          'pedidos.recepcionesPedido',
          'pedidos.pedidoUsuario',
        ],
      });

      if (!batch) {
        throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
      }

      if (!batch.pedidos.length) {
        throw new BadRequestException(
          'El pedido no contiene pedidos internos para restaurar.'
        );
      }

      const invalidPedido = batch.pedidos.find(
        (pedido) => pedido.estado !== EstadoPedido.CANCELADO
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden restaurar lotes cuyos pedidos internos estén cancelados.'
        );
      }

      const pedidoConRecepciones = batch.pedidos.find(
        (pedido) =>
          pedido.recepcionesPedido && pedido.recepcionesPedido.length > 0
      );

      if (pedidoConRecepciones) {
        throw new BadRequestException(
          'No se puede restaurar un pedido que ya tenga recepciones registradas.'
        );
      }

      for (const pedido of batch.pedidos) {
        pedido.estado = EstadoPedido.PENDIENTE_DE_APROBACION;
        pedido.motivoCancelacion = undefined;
        if (userId) {
          pedido.modifiedBy = userId;
        }
        await queryRunner.manager.save(Pedido, pedido);
      }

      const touchedPedidoUsuarios = new Set(
        batch.pedidos
          .map((pedido) => pedido.pedidoUsuario)
          .filter((pedidoUsuario): pedidoUsuario is PedidoUsuario =>
            Boolean(pedidoUsuario)
          )
      );

      for (const pedidoUsuario of touchedPedidoUsuarios) {
        pedidoUsuario.estado = EstadoPedidoUsuario.PENDIENTE;
        if (userId) {
          pedidoUsuario.modifiedBy = userId;
        }
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();

      return this.findOne(batch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al restaurar el pedido: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async cancelBatchOrder(
    id: string,
    dto: CancelPurchaseBatchDto,
    userId?: string
  ): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: [
          'pedidos',
          'pedidos.recepcionesPedido',
          'pedidos.pedidoUsuario',
        ],
      });

      if (!batch) {
        throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
      }

      if (!batch.pedidos.length) {
        throw new BadRequestException(
          'El pedido no contiene pedidos internos para cancelar.'
        );
      }

      const invalidPedido = batch.pedidos.find(
        (pedido) =>
          [
            EstadoPedido.PENDIENTE_DE_APROBACION,
            EstadoPedido.POR_RECEPCIONAR,
          ].includes(pedido.estado) === false
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden cancelar pedidos completos cuyos pedidos internos sigan pendientes.'
        );
      }

      const pedidoConRecepciones = batch.pedidos.find(
        (pedido) =>
          pedido.recepcionesPedido && pedido.recepcionesPedido.length > 0
      );

      if (pedidoConRecepciones) {
        throw new BadRequestException(
          'No se puede cancelar un pedido que ya tenga recepciones registradas.'
        );
      }

      const motivo = dto.motivoCancelacion || 'Cancelado por el usuario';

      for (const pedido of batch.pedidos) {
        pedido.estado = EstadoPedido.CANCELADO;
        pedido.motivoCancelacion = motivo;
        if (userId) {
          pedido.modifiedBy = userId;
        }
        await queryRunner.manager.save(Pedido, pedido);
      }

      const touchedPedidoUsuarios = new Set(
        batch.pedidos
          .map((pedido) => pedido.pedidoUsuario)
          .filter((pedidoUsuario): pedidoUsuario is PedidoUsuario =>
            Boolean(pedidoUsuario)
          )
      );

      for (const pedidoUsuario of touchedPedidoUsuarios) {
        pedidoUsuario.estado = EstadoPedidoUsuario.CANCELADO;
        if (userId) {
          pedidoUsuario.modifiedBy = userId;
        }
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();

      return this.findOne(batch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al cancelar el pedido: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Returns a single PurchaseBatch by ID with all relevant relations loaded.
   *
   * Also annotates each pedido product line with `hasLinkedMovements` to indicate
   * whether receptions or incidences reference it.
   *
   * @param id - UUID of the PurchaseBatch
   * @returns The decorated PurchaseBatch
   * @throws NotFoundException if no batch exists with the given ID
   */
  async findOne(id: string): Promise<PurchaseBatch> {
    const batch = await this.dataSource.getRepository(PurchaseBatch).findOne({
      where: { id },
      relations: [
        'pedidos',
        'pedidos.proveedor',
        'pedidos.usuario',
        'pedidos.pedidoUsuario',
        'pedidos.pedidoProductos',
        'pedidos.pedidoProductos.productoProveedor',
        'pedidos.pedidoProductos.productoProveedor.producto',
        'usuario',
      ],
    });

    if (!batch) {
      throw new NotFoundException(I18nHelper.getError('BATCH_NOT_FOUND'));
    }

    await this.annotateLinkedMovements(batch.pedidos || []);

    return this.decorateBatchIdentity(batch);
  }

  /**
   * Recalculates and persists the batch status derived from its child pedido states.
   *
   * Called automatically after any individual pedido status change within the batch.
   * Can be executed inside an existing transaction by passing `manager`.
   *
   * @param batchId - UUID of the PurchaseBatch to sync
   * @param manager - Optional EntityManager to participate in a parent transaction
   * @param actorId - ID of the actor triggering the sync (written to `modifiedBy`)
   */
  async syncBatchStatus(
    batchId: string,
    manager?: EntityManager,
    actorId?: string
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(PurchaseBatch)
      : this.dataSource.getRepository(PurchaseBatch);

    const batch = await repo.findOne({
      where: { id: batchId },
      relations: ['pedidos'],
    });

    if (!batch) return;

    const nuevoEstado = PurchaseBatch.calcularEstadoLote(batch.pedidos);

    if (batch.estado !== nuevoEstado) {
      batch.estado = nuevoEstado;
      if (actorId) {
        batch.modifiedBy = actorId;
      }
      await repo.save(batch);
    }
  }

  private async pedidoProductoHasReferences(
    manager: EntityManager,
    pedidoProductoId: string
  ): Promise<boolean> {
    const [recepcionesCount, incidenciasCount] = await Promise.all([
      manager.count(RecepcionProducto, {
        where: { pedidoProductoId },
      }),
      manager.count(IncidenciaLinea, {
        where: { pedidoProductoId },
      }),
    ]);

    return recepcionesCount > 0 || incidenciasCount > 0;
  }

  private async pedidoHasRecepcionReferences(
    manager: EntityManager,
    pedidoId: string
  ): Promise<boolean> {
    const recepcionPedidoCount = await manager.count(RecepcionPedido, {
      where: { pedidoId },
    });

    return recepcionPedidoCount > 0;
  }

  private async annotateLinkedMovements(pedidos: Pedido[]): Promise<void> {
    const lineIds = pedidos.flatMap((pedido) =>
      (pedido.pedidoProductos || []).map((line) => line.id)
    );

    if (lineIds.length === 0) {
      return;
    }

    const [recepciones, incidencias] = await Promise.all([
      this.dataSource.getRepository(RecepcionProducto).find({
        select: ['pedidoProductoId'],
        where: { pedidoProductoId: In(lineIds) },
      }),
      this.dataSource.getRepository(IncidenciaLinea).find({
        select: ['pedidoProductoId'],
        where: { pedidoProductoId: In(lineIds) },
      }),
    ]);

    const referencedLineIds = new Set<string>([
      ...recepciones.map((item) => item.pedidoProductoId),
      ...incidencias.map((item) => item.pedidoProductoId),
    ]);

    pedidos.forEach((pedido) => {
      (pedido.pedidoProductos || []).forEach((line) => {
        line.hasLinkedMovements = referencedLineIds.has(line.id);
      });
    });
  }

  private calculateFechaEntrega(baseDate = new Date()): Date {
    const hours = this.configService.get<number>(
      'PEDIDO_FECHA_ENTREGA_HOURS',
      48
    );
    const fechaEntrega = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
    return fechaEntrega;
  }

  private async createBatchFromPedidoUsuarioIds(
    pedidoUsuarioIds: string[],
    userId: string,
    observaciones: string | undefined,
    mode: BatchCreationMode
  ): Promise<PurchaseBatch> {
    if (pedidoUsuarioIds.length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('SELECT_AT_LEAST_ONE_ORDER')
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidosUsuario = await queryRunner.manager.find(PedidoUsuario, {
        where: { id: In(pedidoUsuarioIds) },
        relations: [
          'pedidos',
          'pedidos.recepcionesPedido',
          'pedidos.proveedor',
          'pedidos.usuario',
          'pedidos.pedidoProductos',
        ],
      });

      if (pedidosUsuario.length !== pedidoUsuarioIds.length) {
        throw new NotFoundException(
          'Uno o varios pedidos seleccionados ya no existen.'
        );
      }

      const invalidPedidoUsuario = pedidosUsuario.find(
        (pedidoUsuario) =>
          pedidoUsuario.estado !== EstadoPedidoUsuario.PENDIENTE
      );

      if (invalidPedidoUsuario) {
        throw new BadRequestException(
          'Solo se pueden aprobar o consolidar pedidos de usuario pendientes.'
        );
      }

      const pedidos = pedidosUsuario.flatMap(
        (pedidoUsuario) => pedidoUsuario.pedidos || []
      );

      const invalidPedido = pedidos.find(
        (pedido) =>
          pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION ||
          Boolean(pedido.batchId) ||
          Boolean((pedido.recepcionesPedido || []).length)
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden aprobar o consolidar pedidos internos pendientes y sin recepciones.'
        );
      }

      const batch = queryRunner.manager.create(PurchaseBatch, {
        numeroGlobal: await reserveNextPurchaseBatchNumero(queryRunner.manager),
        usuarioId: userId,
        observaciones,
        estado: EstadoLote.PENDIENTE,
        modifiedBy: userId,
      });

      batch.referencia = formatPurchaseBatchReferencia(batch.numeroGlobal);

      const savedBatch = await queryRunner.manager.save(PurchaseBatch, batch);

      for (const pedido of pedidos) {
        pedido.batchId = savedBatch.id;
        pedido.estado = EstadoPedido.POR_RECEPCIONAR;
        pedido.modifiedBy = userId;
        await queryRunner.manager.save(Pedido, pedido);
      }

      const nextPedidoUsuarioEstado =
        mode === 'approve'
          ? EstadoPedidoUsuario.APROBADO
          : EstadoPedidoUsuario.CONSOLIDADO;

      for (const pedidoUsuario of pedidosUsuario) {
        pedidoUsuario.estado = nextPedidoUsuarioEstado;
        pedidoUsuario.modifiedBy = userId;
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(savedBatch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();

      return this.findOne(savedBatch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al crear la compra desde pedidos visibles: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  private decorateBatchIdentity(batch: PurchaseBatch): PurchaseBatch {
    batch.numeroLote = batch.numeroGlobal;
    batch.referenciaLote = batch.referencia;

    (batch.pedidos || []).forEach((pedido) => {
      const semanticPedido = pedido as PedidoSemanticShape;
      semanticPedido.numeroPedidoProveedor = pedido.numeroGlobal;

      const numeroPedidoVisible = pedido.pedidoUsuario?.numeroGlobal;
      if (numeroPedidoVisible) {
        semanticPedido.numeroPedidoVisible = numeroPedidoVisible;
        semanticPedido.referenciaPedidoVisible = `PU-${numeroPedidoVisible}`;
      }
    });

    return batch;
  }
}
