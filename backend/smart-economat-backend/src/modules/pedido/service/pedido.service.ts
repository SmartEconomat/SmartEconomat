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
import { reserveNextPedidoProveedorNumero } from '../utils/pedido-numero.util';

/**
 * Documentación en español.
 */
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

  /**
   * Documentación en español.
   */
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
      built.pedido.numeroGlobal = await reserveNextPedidoProveedorNumero(
        queryRunner.manager
      );
      built.pedido.modifiedBy = userId;

      const savedPedido = await queryRunner.manager.save(Pedido, built.pedido);

      for (const pp of built.pedidoProductos) {
        await queryRunner.manager.save(PedidoProducto, {
          ...pp,
          pedido: { id: savedPedido.id },
          modifiedBy: userId,
        });
      }

      await queryRunner.commitTransaction();

      await this.movimientoHelper.trackPedidoCreation(
        userId,
        savedPedido.id,
        I18nHelper.translate('receta.movimiento.descripcion_creacion', {
          id: savedPedido.id,
        })
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
      throw new ConflictException(
        I18nHelper.getError('PEDIDO_CREATE_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Documentación en español.
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  /**
   * Documentación en español.
   */
  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  /**
   * Documentación en español.
   */
  async update(
    id: string,
    updatePedidoDto: UpdatePedidoDto,
    userId?: string
  ): Promise<Pedido> {
    await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUpdateData: Partial<Pedido> = {};

      if (updatePedidoDto.proveedorId) {
        pedidoUpdateData.proveedorId = updatePedidoDto.proveedorId;
      }

      if (updatePedidoDto.observaciones !== undefined) {
        pedidoUpdateData.observaciones = updatePedidoDto.observaciones;
      }

      if (userId) {
        pedidoUpdateData.modifiedBy = userId;
      }

      if (updatePedidoDto.lineas !== undefined) {
        if (updatePedidoDto.lineas.length === 0) {
          throw new BadRequestException(
            I18nHelper.getError('PEDIDO_MUST_HAVE_ONE_PRODUCT')
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
              I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND_ID', {
                id: linea.productoProveedorId,
              })
            );
          }

          const precioVigente = productoProveedor.precioUnitario;
          if (precioVigente === null || precioVigente === undefined) {
            throw new ConflictException(
              I18nHelper.getError('PRODUCT_PROVIDER_NO_PRICE', {
                id: linea.productoProveedorId,
              })
            );
          }

          const costeLinea = Number(precioVigente) * Number(linea.cantidad);
          nuevoCosteTotal += costeLinea;

          lineasActualizadas.push({
            pedido: { id },
            productoProveedor: { id: productoProveedor.id },
            cantidad: linea.cantidad,
            precioUnitario: precioVigente,
            modifiedBy: userId,
          });
        }

        pedidoUpdateData.costeTotal = nuevoCosteTotal;

        for (const linea of lineasActualizadas) {
          await queryRunner.manager.save(PedidoProducto, linea);
        }
      }

      if (Object.keys(pedidoUpdateData).length > 0) {
        await queryRunner.manager.update(Pedido, { id }, pedidoUpdateData);
      }

      await queryRunner.commitTransaction();

      return await this.findOne(id);
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
        I18nHelper.getError('PEDIDO_UPDATE_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  updateFechaEntrega(id: string, dto: UpdatePedidoDto): Promise<Pedido> {
    void dto;
    return this.findOne(id);
  }

  /**
   * Documentación en español.
   */
  async cancelarPedido(
    id: string,
    dto: CancelPedidoDto,
    userId?: string
  ): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_ONLY_PENDING_CAN_BE_CANCELLED')
      );
    }

    if (pedido.recepcionesPedido && pedido.recepcionesPedido.length > 0) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_HAS_RECEPTIONS')
      );
    }

    pedido.estado = EstadoPedido.CANCELADO;
    pedido.motivoCancelacion =
      dto.motivoCancelacion ||
      I18nHelper.translate('pedidos.cancelar.motivoPorDefecto');
    if (userId) {
      pedido.modifiedBy = userId;
    }
    return await this.pedidoRepository.save(pedido);
  }

  /**
   * Documentación en español.
   */
  async restaurarPedido(id: string, userId?: string): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (pedido.estado !== EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_ONLY_CANCELLED_CAN_BE_RESTORED')
      );
    }

    pedido.estado = EstadoPedido.PENDIENTE_DE_APROBACION;
    pedido.motivoCancelacion = undefined;
    if (userId) {
      pedido.modifiedBy = userId;
    }
    return await this.pedidoRepository.save(pedido);
  }

  /**
   * Documentación en español.
   */
  async aceptarPedido(id: string, userId?: string): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_ONLY_PENDING_CAN_BE_ACCEPTED')
      );
    }
    return this.handleStatusTransition(
      id,
      PedidoStatusTrigger.ACEPTAR,
      undefined,
      userId
    );
  }

  /**
   * Documentación en español.
   */
  async handleStatusTransition(
    pedidoId: string,
    trigger: PedidoStatusTrigger,
    manager?: EntityManager,
    actorId?: string
  ): Promise<Pedido> {
    const pedido = manager
      ? await manager.findOne(Pedido, { where: { id: pedidoId } })
      : await this.pedidoRepository.findOneBy({ id: pedidoId });

    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    if (pedido.estado === EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANCELLED_CANNOT_TRANSITION')
      );
    }

    pedido.estado = this.resolveStatusFromTrigger(trigger);
    if (actorId) {
      pedido.modifiedBy = actorId;
    }

    const savedPedido = manager
      ? await manager.save(Pedido, pedido)
      : await this.pedidoRepository.save(pedido);

    if (savedPedido.batchId) {
      await this.purchaseBatchService.syncBatchStatus(
        savedPedido.batchId,
        manager,
        actorId
      );
    }

    if (savedPedido.pedidoUsuarioId) {
      await this.pedidoUsuarioService.syncPedidoUsuarioStatus(
        savedPedido.pedidoUsuarioId,
        manager,
        actorId
      );
    }

    return savedPedido;
  }

  /**
   * Documentación en español.
   */
  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION &&
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
    return EstadoPedido.PENDIENTE_DE_APROBACION;
  }

  private resolveStatusFromTrigger(trigger: PedidoStatusTrigger): EstadoPedido {
    switch (trigger) {
      case PedidoStatusTrigger.ACEPTAR:
        return EstadoPedido.POR_RECEPCIONAR;
      case PedidoStatusTrigger.RECEPCION_PARCIAL:
        return EstadoPedido.PARCIAL;
      case PedidoStatusTrigger.RECEPCION_TOTAL:
        return EstadoPedido.RECEPCIONADO;
      case PedidoStatusTrigger.INCIDENCIA:
        return EstadoPedido.INCIDENCIA;
      default:
        throw new BadRequestException(
          I18nHelper.getError('ORDER_TRANSITION_NOT_SUPPORTED')
        );
    }
  }
}
