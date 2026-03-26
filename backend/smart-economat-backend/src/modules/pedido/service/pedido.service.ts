import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { PedidoRepository } from '../repository/pedido.repository';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { buildPedidoAggregate } from '../../../application/pedido/pedido.factory';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PedidoStatusTrigger } from '../enums/pedido-status-trigger.enum';
import { PurchaseBatchService } from './purchase-batch.service';
import { PedidoUsuarioService } from './pedido-usuario.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class PedidoService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PurchaseBatchService))
    private readonly purchaseBatchService: PurchaseBatchService,
    @Inject(forwardRef(() => PedidoUsuarioService))
    private readonly pedidoUsuarioService: PedidoUsuarioService
  ) {}

  async create(
    createPedidoDto: CreatePedidoDto,
    userId: string
  ): Promise<Pedido> {
    const estadoInicial = this.getInitialStatus();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const built = await buildPedidoAggregate(
        queryRunner.manager,
        createPedidoDto,
        userId,
        estadoInicial,
        () => this.calculateFechaEntrega()
      );

      const savedPedido = await queryRunner.manager.save(Pedido, built.pedido);

      for (const pp of built.pedidoProductos) {
        await queryRunner.manager.save(PedidoProducto, {
          ...pp,
          pedido: { id: savedPedido.id },
        });
      }

      await queryRunner.commitTransaction();

      await this.movimientoHelper.trackPedidoCreation(
        userId,
        savedPedido.id,
        `Creación de pedido #${savedPedido.id}`
      );

      return await this.findOne(savedPedido.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(`Error al crear el pedido: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (updatePedidoDto.proveedorId) {
      pedido.proveedor = { id: updatePedidoDto.proveedorId } as any;
    }

    if (updatePedidoDto.observaciones !== undefined) {
      pedido.observaciones = updatePedidoDto.observaciones;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updatePedidoDto.lineas !== undefined) {
        if (updatePedidoDto.lineas.length === 0) {
          throw new BadRequestException(
            'El pedido debe contener al menos un producto.'
          );
        }

        await queryRunner.manager.delete(PedidoProducto, {
          pedido: { id },
        });

        const lineasActualizadas: any[] = [];
        let nuevoCosteTotal = 0;

        for (const linea of updatePedidoDto.lineas) {
          const productoProveedor = await queryRunner.manager.findOne(
            ProductoProveedor,
            {
              where: { id: linea.productoProveedorId },
            }
          );

          if (!productoProveedor) {
            throw new NotFoundException(
              `El producto proveedor con ID ${linea.productoProveedorId} no existe.`
            );
          }

          const precioVigente = productoProveedor.precioUnitario;
          if (precioVigente === null || precioVigente === undefined) {
            throw new ConflictException(
              `El producto proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente.`
            );
          }

          const costeLinea = Number(precioVigente) * Number(linea.cantidad);
          nuevoCosteTotal += costeLinea;

          lineasActualizadas.push({
            pedido: { id: pedido.id },
            productoProveedor: { id: productoProveedor.id },
            cantidad: linea.cantidad,
            precioUnitario: precioVigente,
          });
        }

        pedido.costeTotal = nuevoCosteTotal;

        for (const linea of lineasActualizadas) {
          await queryRunner.manager.save(PedidoProducto, linea);
        }
      }

      const savedPedido = await queryRunner.manager.save(Pedido, pedido);
      await queryRunner.commitTransaction();

      return await this.findOne(savedPedido.id);
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

  updateFechaEntrega(id: string, dto: UpdatePedidoDto): Promise<Pedido> {
    void id;
    void dto;
    throw new BadRequestException(
      'La fecha de entrega se calcula automáticamente y no puede editarse manualmente.'
    );
  }

  async cancelarPedido(id: string, dto: CancelPedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden cancelar los pedidos que estén en estado pendiente.'
      );
    }

    if (pedido.recepcionesPedido && pedido.recepcionesPedido.length > 0) {
      throw new BadRequestException(
        'No se puede cancelar un pedido que ya tiene recepciones registradas.'
      );
    }

    pedido.estado = EstadoPedido.CANCELADO;
    pedido.motivoCancelacion =
      dto.motivoCancelacion || 'Cancelado por el usuario';
    return await this.pedidoRepository.save(pedido);
  }

  async aceptarPedido(id: string): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      throw new BadRequestException(
        'Solo los pedidos pendientes pueden ser aceptados.'
      );
    }
    return this.handleStatusTransition(id, PedidoStatusTrigger.ACEPTAR);
  }

  async handleStatusTransition(
    pedidoId: string,
    trigger: PedidoStatusTrigger,
    manager?: EntityManager
  ): Promise<Pedido> {
    const pedido = manager
      ? await manager.findOne(Pedido, { where: { id: pedidoId } })
      : await this.pedidoRepository.findOneBy({ id: pedidoId });

    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    if (pedido.estado === EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        'No se puede transicionar un pedido cancelado.'
      );
    }

    pedido.estado = this.resolveStatusFromTrigger(trigger);

    const savedPedido = manager
      ? await manager.save(Pedido, pedido)
      : await this.pedidoRepository.save(pedido);

    if (savedPedido.batchId) {
      await this.purchaseBatchService.syncBatchStatus(
        savedPedido.batchId,
        manager
      );
    }

    if (savedPedido.pedidoUsuarioId) {
      await this.pedidoUsuarioService.syncPedidoUsuarioStatus(
        savedPedido.pedidoUsuarioId,
        manager
      );
    }

    return savedPedido;
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado !== EstadoPedido.PENDIENTE &&
      pedido.estado !== EstadoPedido.CANCELADO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANNOT_BE_DELETED')
      );
    }

    await this.pedidoRepository.softDelete(id);
  }

  private calculateFechaEntrega(baseDate = new Date()): Date {
    const hours = this.configService.get<number>(
      'PEDIDO_FECHA_ENTREGA_HOURS',
      48
    );
    const fechaEntrega = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
    return fechaEntrega;
  }

  private getInitialStatus(): EstadoPedido {
    return EstadoPedido.PENDIENTE;
  }

  private resolveStatusFromTrigger(trigger: PedidoStatusTrigger): EstadoPedido {
    switch (trigger) {
      case PedidoStatusTrigger.ACEPTAR:
        return EstadoPedido.EN_PROCESO;
      case PedidoStatusTrigger.RECEPCION_PARCIAL:
        return EstadoPedido.PARCIAL;
      case PedidoStatusTrigger.RECEPCION_TOTAL:
        return EstadoPedido.RECIBIDO;
      case PedidoStatusTrigger.INCIDENCIA:
        return EstadoPedido.INCIDENCIA;
      default:
        throw new BadRequestException(
          'Disparador de transición de pedido no soportado.'
        );
    }
  }
}
