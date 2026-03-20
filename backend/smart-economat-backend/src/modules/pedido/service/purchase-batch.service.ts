import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PurchaseBatch } from '../purchase-batch.entity/purchase-batch.entity';
import { CreatePurchaseBatchDto } from '../dto/create-purchase-batch.dto';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { EstadoLote } from '../enums/estado-lote.enum';
import { buildPedidoAggregate } from '../../../application/pedido/pedido.factory';
import { ConfigService } from '@nestjs/config';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { In } from 'typeorm';

@Injectable()
export class PurchaseBatchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly movimientoHelper: MovimientoHelper
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
        const createPedidoDto = {
          proveedorId,
          lineas,
        };

        const built = await buildPedidoAggregate(
          queryRunner.manager,
          createPedidoDto as any,
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
          await queryRunner.manager.save(PedidoProducto, {
            ...pp,
            pedido: { id: savedPedido.id },
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

  async findAll(): Promise<PurchaseBatch[]> {
    return this.dataSource.getRepository(PurchaseBatch).find({
      relations: ['pedidos', 'pedidos.proveedor', 'usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PurchaseBatch> {
    const batch = await this.dataSource.getRepository(PurchaseBatch).findOne({
      where: { id },
      relations: [
        'pedidos',
        'pedidos.proveedor',
        'pedidos.pedidoProductos',
        'pedidos.pedidoProductos.productoProveedor',
        'pedidos.pedidoProductos.productoProveedor.producto',
        'usuario',
      ],
    });

    if (!batch) {
      throw new NotFoundException(`Lote de compra #${id} no encontrado`);
    }

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

  private calculateFechaEntrega(baseDate = new Date()): Date {
    const hours = this.configService.get<number>(
      'PEDIDO_FECHA_ENTREGA_HOURS',
      48
    );
    const fechaEntrega = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
    return fechaEntrega;
  }
}
