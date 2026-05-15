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
import { PedidoUsuarioStateMachine } from '../state/pedido-usuario.state-machine';
import { PedidoStateMachine } from '../state/pedido.state-machine';
import { AccionMovimiento } from '../../movimiento/enums/movimiento.enums';
import {
  canApprove,
  canConsolidateWeek,
} from '../domain/order-consolidation.rules';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { calculatePedidoFechaEntrega } from '../utils/calculate-pedido-fecha-entrega.util';

type BatchCreationMode = 'approve' | 'consolidate';
type PedidoSemanticShape = Pedido & {
  numeroPedidoProveedor?: string;
  numeroPedidoVisible?: string;
  referenciaPedidoVisible?: string;
};

/**
 * Servicio de dominio para purchase batch.
 */
@Injectable()
export class PurchaseBatchService {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   * @undefined {ConfigService<Record<string | symbol, unknown>, false>} configService - Entrada efectiva esperada por el contrato.
   * @undefined {MovimientoHelper} movimientoHelper - Entrada efectiva esperada por el contrato.
   * @undefined {ProduccionService} produccionService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly produccionService: ProduccionService
  ) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
          () => calculatePedidoFechaEntrega(this.configService)
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
          `Pedido #${savedPedido.id} (Lote #${savedBatch.id})`,
          undefined,
          queryRunner.manager
        );
      }

      savedBatch.isAprobado = true;
      savedBatch.modifiedBy = userId;
      await queryRunner.manager.save(PurchaseBatch, savedBatch);

      await queryRunner.commitTransaction();
      const createdBatch = await this.findOne(savedBatch.id);
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'PurchaseBatch',
        entidadId: createdBatch.id,
        accion: AccionMovimiento.CREATE,
        descripcion: `Creación de lote de compra ${createdBatch.id}`,
        after: createdBatch,
      });

      return createdBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMissingStockBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "buildPedidoUsuarioDtoFromMissingStock" en smart-economat-backend (Nest).
   * @undefined {CreateMissingStockBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<CreatePedidoUsuarioDto>} Datos efectivos después de ejecutar la operación.
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
   * Lista paginada de lotes de compra (con relaciones habituales).
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<PurchaseBatch>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const orderDir = query.order ?? query.sortOrder ?? 'DESC';
    const sortFieldMap: Record<string, keyof PurchaseBatch> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      numeroGlobal: 'numeroGlobal',
      estado: 'estado',
      fechaCreacion: 'createdAt',
      referencia: 'referencia',
    };
    const sortBy =
      sortFieldMap[query.sortBy ?? 'createdAt'] ?? ('createdAt' as const);

    const [batches, total] = await this.dataSource
      .getRepository(PurchaseBatch)
      .findAndCount({
        relations: [
          'pedidos',
          'pedidos.proveedor',
          'pedidos.pedidoUsuario',
          'usuario',
        ],
        order: { [sortBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: batches.map((batch) => this.decorateBatchIdentity(batch)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Busca all.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {Promise<PurchaseBatch[]>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "consolidateExistingOrders" en smart-economat-backend (Nest).
   * @undefined {ConsolidatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
      'consolidate',
      dto.autoApprovePending ?? false
    );
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "approvePedidoUsuario" en smart-economat-backend (Nest).
   * @undefined {string} pedidoUsuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async approvePedidoUsuario(
    pedidoUsuarioId: string,
    userId: string
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUsuario = await queryRunner.manager.findOne(PedidoUsuario, {
        where: { id: pedidoUsuarioId },
        relations: ['pedidos', 'pedidos.recepcionesPedido'],
      });

      if (!pedidoUsuario) {
        throw new NotFoundException('El pedido de usuario ya no existe.');
      }

      if (pedidoUsuario.estado === EstadoPedidoUsuario.CONSOLIDADO) {
        throw new BadRequestException(
          'No se puede aprobar un pedido que ya está consolidado semanalmente.'
        );
      }

      if (pedidoUsuario.estado !== EstadoPedidoUsuario.PENDIENTE) {
        throw new BadRequestException(
          'Solo se pueden aprobar pedidos de usuario en estado pendiente.'
        );
      }

      const pedidos = pedidoUsuario.pedidos || [];
      const invalidPedido = pedidos.find(
        (pedido) =>
          pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION ||
          Boolean((pedido.recepcionesPedido || []).length)
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden aprobar pedidos internos pendientes de aprobación y sin recepciones.'
        );
      }

      PedidoUsuarioStateMachine.applyTransition(
        pedidoUsuario,
        EstadoPedidoUsuario.APROBADO
      );
      pedidoUsuario.modifiedBy = userId;
      await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);

      await queryRunner.commitTransaction();
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new ConflictException(
        `Error al aprobar el pedido de usuario: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  async updateBatchOrder(
    id: string,
    dto: UpdatePurchaseBatchDto,
    userId?: string
  ): Promise<PurchaseBatch> {
    const before = await this.findOne(id);
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
              fechaEntrega:
                dto.fechaEntrega ??
                calculatePedidoFechaEntrega(this.configService),
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
      const updatedBatch = await this.findOne(batch.id);

      if (userId) {
        await this.movimientoHelper.trackAction({
          userId,
          entidad: 'PurchaseBatch',
          entidadId: batch.id,
          accion: AccionMovimiento.UPDATE,
          descripcion: `Actualización de lote de compra ${batch.id}`,
          before,
          after: updatedBatch,
        });
      }

      return updatedBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

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

  /**
   * Expone "acceptBatchOrder" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  async acceptBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    const before = await this.findOne(id);
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
          PedidoStateMachine.applyTransition(
            pedido,
            EstadoPedido.POR_RECEPCIONAR
          );
        }
        if (userId) {
          pedido.modifiedBy = userId;
        }
        await queryRunner.manager.save(Pedido, pedido);
      }

      batch.isAprobado = true;
      if (userId) {
        batch.modifiedBy = userId;
      }
      await queryRunner.manager.save(PurchaseBatch, batch);

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();
      const approvedBatch = await this.findOne(batch.id);

      if (userId) {
        await this.movimientoHelper.trackAction({
          userId,
          entidad: 'PurchaseBatch',
          entidadId: batch.id,
          accion: AccionMovimiento.UPDATE,
          descripcion: `Aprobación de lote de compra ${batch.id}`,
          before,
          after: approvedBatch,
        });
      }

      return approvedBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

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

  /**
   * Expone "approveBatchOrder" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  async approveBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    return this.acceptBatchOrder(id, userId);
  }

  /**
   * Expone "restoreBatchOrder" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  async restoreBatchOrder(id: string, userId?: string): Promise<PurchaseBatch> {
    const before = await this.findOne(id);
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
        PedidoStateMachine.applyTransition(
          pedido,
          EstadoPedido.PENDIENTE_DE_APROBACION
        );
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
        PedidoUsuarioStateMachine.applyTransition(
          pedidoUsuario,
          EstadoPedidoUsuario.PENDIENTE
        );
        if (userId) {
          pedidoUsuario.modifiedBy = userId;
        }
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();
      const restoredBatch = await this.findOne(batch.id);

      if (userId) {
        await this.movimientoHelper.trackAction({
          userId,
          entidad: 'PurchaseBatch',
          entidadId: batch.id,
          accion: AccionMovimiento.UPDATE,
          descripcion: `Restauración de lote de compra ${batch.id}`,
          before,
          after: restoredBatch,
        });
      }

      return restoredBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

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

  /**
   * Expone "cancelBatchOrder" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {CancelPurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  async cancelBatchOrder(
    id: string,
    dto: CancelPurchaseBatchDto,
    userId?: string
  ): Promise<PurchaseBatch> {
    const before = await this.findOne(id);
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
        PedidoStateMachine.applyTransition(pedido, EstadoPedido.CANCELADO);
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
        PedidoUsuarioStateMachine.applyTransition(
          pedidoUsuario,
          EstadoPedidoUsuario.CANCELADO
        );
        if (userId) {
          pedidoUsuario.modifiedBy = userId;
        }
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();
      const cancelledBatch = await this.findOne(batch.id);

      if (userId) {
        await this.movimientoHelper.trackAction({
          userId,
          entidad: 'PurchaseBatch',
          entidadId: batch.id,
          accion: AccionMovimiento.UPDATE,
          descripcion: `Cancelación de lote de compra ${batch.id}`,
          before,
          after: cancelledBatch,
        });
      }

      return cancelledBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

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
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "syncBatchStatus" en smart-economat-backend (Nest).
   * @undefined {string} batchId - Entrada efectiva esperada por el contrato.
   * @undefined {EntityManager | undefined} manager - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} actorId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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

    const referencedLineIds = new Set<string>(
      [
        ...recepciones.map((item) => item.pedidoProductoId),
        ...incidencias.map((item) => item.pedidoProductoId),
      ].filter((id): id is string => typeof id === 'string' && id.length > 0)
    );

    pedidos.forEach((pedido) => {
      (pedido.pedidoProductos || []).forEach((line) => {
        line.hasLinkedMovements = referencedLineIds.has(line.id);
      });
    });
  }

  private async createBatchFromPedidoUsuarioIds(
    pedidoUsuarioIds: string[],
    userId: string,
    observaciones: string | undefined,
    mode: BatchCreationMode,
    autoApprovePending: boolean
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
          ![
            EstadoPedidoUsuario.PENDIENTE,
            EstadoPedidoUsuario.APROBADO,
          ].includes(pedidoUsuario.estado)
      );

      if (invalidPedidoUsuario) {
        throw new BadRequestException(
          'Solo se pueden aprobar o consolidar pedidos de usuario en estado pendiente o aprobado.'
        );
      }

      if (mode === 'consolidate') {
        const alreadyConsolidated = pedidosUsuario.find(
          (pedidoUsuario) =>
            pedidoUsuario.estado === EstadoPedidoUsuario.CONSOLIDADO
        );
        if (alreadyConsolidated) {
          throw new BadRequestException(
            'No se puede consolidar: uno o varios pedidos ya están consolidados semanalmente.'
          );
        }

        const weekDecision = canConsolidateWeek(
          { orders: pedidosUsuario },
          { autoApprovePending }
        );
        if (!weekDecision.allowed) {
          if (weekDecision.reason === 'order.pendingRequiresAutoApproval') {
            throw new BadRequestException(
              'Hay pedidos pendientes. Reintenta con autoApprovePending=true para auto-aprobar y consolidar.'
            );
          }

          if (weekDecision.reason === 'order.hasRecepciones') {
            throw new BadRequestException(
              'No se puede consolidar un pedido de usuario que ya tenga recepciones registradas.'
            );
          }

          throw new BadRequestException(
            'No se pudo consolidar el grupo de pedidos seleccionado.'
          );
        }
      }

      const pedidos = pedidosUsuario.flatMap(
        (pedidoUsuario) => pedidoUsuario.pedidos || []
      );

      const allowedEstadosInternos =
        mode === 'approve'
          ? new Set<EstadoPedido>([EstadoPedido.PENDIENTE_DE_APROBACION])
          : new Set<EstadoPedido>([
              EstadoPedido.PENDIENTE_DE_APROBACION,
              EstadoPedido.POR_RECEPCIONAR,
            ]);

      const invalidPedido = pedidos.find(
        (pedido) =>
          !allowedEstadosInternos.has(pedido.estado) ||
          Boolean((pedido.recepcionesPedido || []).length)
      );

      if (invalidPedido) {
        throw new BadRequestException(
          mode === 'approve'
            ? 'Solo se pueden aprobar pedidos internos pendientes de aprobación y sin recepciones.'
            : 'Solo se pueden consolidar pedidos internos pendientes de aprobación o por recepcionar, y sin recepciones.'
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

      for (const pedidoUsuario of pedidosUsuario) {
        if (mode === 'consolidate') {
          if (pedidoUsuario.estado === EstadoPedidoUsuario.PENDIENTE) {
            if (!autoApprovePending) {
              throw new BadRequestException(
                'Hay pedidos pendientes. Reintenta con autoApprovePending=true para auto-aprobar y consolidar.'
              );
            }

            const canAutoApprove = canApprove(pedidoUsuario);
            if (!canAutoApprove) {
              throw new BadRequestException(
                'No se puede auto-aprobar uno de los pedidos pendientes antes de consolidar.'
              );
            }

            PedidoUsuarioStateMachine.applyTransition(
              pedidoUsuario,
              EstadoPedidoUsuario.APROBADO
            );
          }

          PedidoUsuarioStateMachine.applyTransition(
            pedidoUsuario,
            EstadoPedidoUsuario.CONSOLIDADO
          );
        } else {
          PedidoUsuarioStateMachine.applyTransition(
            pedidoUsuario,
            EstadoPedidoUsuario.APROBADO
          );
        }
        pedidoUsuario.modifiedBy = userId;
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      for (const pedido of pedidos) {
        pedido.batchId = savedBatch.id;
        if (pedido.estado !== EstadoPedido.POR_RECEPCIONAR) {
          PedidoStateMachine.applyTransition(
            pedido,
            EstadoPedido.POR_RECEPCIONAR
          );
        }
        pedido.modifiedBy = userId;
        await queryRunner.manager.save(Pedido, pedido);
      }

      savedBatch.isAprobado = true;
      await queryRunner.manager.save(PurchaseBatch, savedBatch);

      await this.syncBatchStatus(savedBatch.id, queryRunner.manager, userId);
      await queryRunner.commitTransaction();
      const createdBatch = await this.findOne(savedBatch.id);
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'PurchaseBatch',
        entidadId: createdBatch.id,
        accion:
          mode === 'consolidate'
            ? AccionMovimiento.CREATE
            : AccionMovimiento.UPDATE,
        descripcion:
          mode === 'approve'
            ? `Aprobación de pedido de usuario y creación de lote ${createdBatch.id}`
            : `Consolidación de pedidos de usuario en lote ${createdBatch.id}`,
        after: createdBatch,
      });

      return createdBatch;
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
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
