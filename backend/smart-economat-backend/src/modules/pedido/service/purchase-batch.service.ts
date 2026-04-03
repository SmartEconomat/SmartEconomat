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
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { IncidenciaLinea } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';

@Injectable()
export class PurchaseBatchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly produccionService: ProduccionService
  ) {}

  /**
   * Crea un lote de pedidos (PurchaseBatch), agrupando automáticamente por proveedor.
   */
  async createBatchOrder(
    dto: CreatePurchaseBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = queryRunner.manager.create(PurchaseBatch, {
        usuarioId: userId,
        observaciones: dto.observaciones,
        estado: EstadoLote.PENDIENTE,
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
          EstadoPedido.PENDIENTE,
          () => this.calculateFechaEntrega()
        );

        built.pedido.batchId = savedBatch.id;

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

  async createBatchOrderFromMissingStock(
    dto: CreateMissingStockBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
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

    return this.createBatchOrder(
      {
        observaciones: dto.observaciones,
        lineas,
      },
      userId
    );
  }

  async findAll(): Promise<PurchaseBatch[]> {
    return this.dataSource.getRepository(PurchaseBatch).find({
      relations: ['pedidos', 'pedidos.proveedor', 'usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  async consolidateExistingOrders(
    dto: ConsolidatePurchaseBatchDto,
    userId: string
  ): Promise<PurchaseBatch> {
    const uniquePedidoUsuarioIds = Array.from(
      new Set(dto.pedidoUsuarioIds || dto.pedidoIds || [])
    );
    if (uniquePedidoUsuarioIds.length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('SELECT_AT_LEAST_ONE_ORDER')
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidosUsuario = await queryRunner.manager.find(PedidoUsuario, {
        where: { id: In(uniquePedidoUsuarioIds) },
        relations: [
          'pedidos',
          'pedidos.proveedor',
          'pedidos.usuario',
          'pedidos.pedidoProductos',
        ],
      });

      if (pedidosUsuario.length !== uniquePedidoUsuarioIds.length) {
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
          'Solo se pueden consolidar pedidos de usuario pendientes.'
        );
      }

      const pedidos = pedidosUsuario.flatMap(
        (pedidoUsuario) => pedidoUsuario.pedidos || []
      );

      const invalidPedido = pedidos.find(
        (pedido) =>
          pedido.estado !== EstadoPedido.PENDIENTE || Boolean(pedido.batchId)
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden consolidar pedidos pendientes que todavía no pertenezcan a un lote.'
        );
      }

      const batch = queryRunner.manager.create(PurchaseBatch, {
        usuarioId: userId,
        observaciones: dto.observaciones,
        estado: EstadoLote.PENDIENTE,
        isAprobado: true,
      });
      const savedBatch = await queryRunner.manager.save(PurchaseBatch, batch);

      for (const pedido of pedidos) {
        pedido.batchId = savedBatch.id;
        pedido.estado = EstadoPedido.PENDIENTE;
        await queryRunner.manager.save(Pedido, pedido);
      }

      for (const pedidoUsuario of pedidosUsuario) {
        pedidoUsuario.estado = EstadoPedidoUsuario.EN_PROCESO;
        await queryRunner.manager.save(PedidoUsuario, pedidoUsuario);
      }

      await this.syncBatchStatus(savedBatch.id, queryRunner.manager);
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
        `Error al consolidar pedidos en lote: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateBatchOrder(
    id: string,
    dto: UpdatePurchaseBatchDto
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
        throw new NotFoundException(`Lote de compra #${id} no encontrado`);
      }

      if (
        batch.pedidos.some((pedido) => pedido.estado !== EstadoPedido.PENDIENTE)
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
              usuarioId: batch.usuarioId,
              proveedorId: productProvider.proveedorId,
              batchId: batch.id,
              estado: EstadoPedido.PENDIENTE,
              observaciones: dto.observaciones,
              fechaEntrega: this.calculateFechaEntrega(),
              costeTotal: 0,
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
          }
        );
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager);
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

  async acceptBatchOrder(id: string): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: ['pedidos'],
      });

      if (!batch) {
        throw new NotFoundException(`Pedido #${id} no encontrado`);
      }

      if (!batch.isAprobado) {
        throw new BadRequestException(
          'El lote debe ser aprobado antes de poder ser tramitado.'
        );
      }

      if (!batch.pedidos.length) {
        throw new BadRequestException(
          'El pedido no contiene pedidos internos para tramitar.'
        );
      }

      const invalidPedido = batch.pedidos.find(
        (pedido) => pedido.estado !== EstadoPedido.PENDIENTE
      );

      if (invalidPedido) {
        throw new BadRequestException(
          'Solo se pueden aprobar pedidos completos cuyos pedidos internos sigan pendientes.'
        );
      }

      for (const pedido of batch.pedidos) {
        pedido.estado = EstadoPedido.EN_PROCESO;
        await queryRunner.manager.save(Pedido, pedido);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager);
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

  async approveBatchOrder(id: string): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
      });

      if (!batch) {
        throw new NotFoundException(`Lote #${id} no encontrado`);
      }

      batch.isAprobado = true;
      await queryRunner.manager.save(PurchaseBatch, batch);

      await queryRunner.commitTransaction();
      return this.findOne(batch.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelBatchOrder(
    id: string,
    dto: CancelPurchaseBatchDto
  ): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: ['pedidos', 'pedidos.recepcionesPedido'],
      });

      if (!batch) {
        throw new NotFoundException(`Pedido #${id} no encontrado`);
      }

      if (!batch.pedidos.length) {
        throw new BadRequestException(
          'El pedido no contiene pedidos internos para cancelar.'
        );
      }

      const invalidPedido = batch.pedidos.find(
        (pedido) => pedido.estado !== EstadoPedido.PENDIENTE
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
        await queryRunner.manager.save(Pedido, pedido);
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager);
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

  async restoreBatchOrder(id: string): Promise<PurchaseBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(PurchaseBatch, {
        where: { id },
        relations: ['pedidos'],
      });

      if (!batch) {
        throw new NotFoundException(`Pedido #${id} no encontrado`);
      }

      for (const pedido of batch.pedidos) {
        if (pedido.estado === EstadoPedido.CANCELADO) {
          pedido.estado = EstadoPedido.PENDIENTE;
          pedido.motivoCancelacion = undefined;
          await queryRunner.manager.save(Pedido, pedido);
        }
      }

      await this.syncBatchStatus(batch.id, queryRunner.manager);
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
      throw new NotFoundException(`Lote de compra #${id} no encontrado`);
    }

    await this.annotateLinkedMovements(batch.pedidos || []);

    return batch;
  }

  /**
   * Actualiza el estado del lote basándose en el estado de sus pedidos.
   * Se llama típicamente después de que un pedido individual cambie de estado.
   */
  async syncBatchStatus(
    batchId: string,
    manager?: EntityManager
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
}
