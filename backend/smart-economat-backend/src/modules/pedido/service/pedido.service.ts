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
 * Core service for managing supplier purchase orders (pedidos).
 *
 * Handles the full lifecycle of a Pedido: creation, update, status transitions
 * (approve, cancel, restore, partial/full reception), and soft deletion.
 * All multi-step operations are wrapped in database transactions with automatic
 * rollback on failure.
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
   * Creates a new supplier order for the given user.
   *
   * Builds the pedido aggregate (entity + line items) inside a transaction,
   * reserves the next global order number, persists all records, and tracks
   * the creation in the movement audit log.
   *
   * @param createPedidoDto - Payload containing supplier, product lines, and optional notes
   * @param userId - ID of the authenticated user creating the order
   * @returns The newly created Pedido with all relations loaded
   * @throws ConflictException if the order could not be persisted
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
      throw new ConflictException(
        I18nHelper.getError('PEDIDO_CREATE_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Returns a paginated list of all pedidos (including soft-deleted relations).
   *
   * @param query - Pagination and filter parameters
   * @returns Paginated response with pedido rows and total count
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  /**
   * Returns a single pedido by ID with all relations loaded.
   *
   * @param id - UUID of the pedido
   * @returns The Pedido entity
   * @throws NotFoundException if no pedido exists with the given ID
   */
  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  /**
   * Updates an existing pedido's supplier, notes, and/or product lines.
   *
   * Line items are replaced atomically: the old set is deleted and the new
   * set is inserted within the same transaction. The total cost is recalculated
   * from current ProductoProveedor prices.
   *
   * @param id - UUID of the pedido to update
   * @param updatePedidoDto - Fields to change; `lineas` replaces the full line set
   * @param userId - ID of the actor making the change (written to `modifiedBy`)
   * @returns The updated Pedido with all relations loaded
   * @throws NotFoundException if the pedido or a product-provider reference does not exist
   * @throws BadRequestException if the new lines array is empty
   * @throws ConflictException if a product-provider has no price set
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
   * Cancels a pending order, recording the cancellation reason.
   *
   * Only orders in `PENDIENTE_DE_APROBACION` state with no registered
   * receptions can be cancelled.
   *
   * @param id - UUID of the pedido to cancel
   * @param dto - Contains the optional `motivoCancelacion` text
   * @param userId - Actor ID written to `modifiedBy`
   * @returns The cancelled Pedido
   * @throws BadRequestException if the order is not in pending state or has receptions
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
      dto.motivoCancelacion || 'Cancelado por el usuario';
    if (userId) {
      pedido.modifiedBy = userId;
    }
    return await this.pedidoRepository.save(pedido);
  }

  /**
   * Restores a previously cancelled order back to `PENDIENTE_DE_APROBACION`.
   *
   * @param id - UUID of the cancelled pedido
   * @param userId - Actor ID written to `modifiedBy`
   * @returns The restored Pedido
   * @throws BadRequestException if the order is not in `CANCELADO` state
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
   * Approves a pending order, transitioning it to `POR_RECEPCIONAR`.
   *
   * @param id - UUID of the pedido to approve
   * @param userId - Actor ID written to `modifiedBy`
   * @returns The approved Pedido after status transition
   * @throws BadRequestException if the order is not in `PENDIENTE_DE_APROBACION` state
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
   * Applies a status transition trigger to a pedido and propagates the change
   * to any associated PurchaseBatch and PedidoUsuario.
   *
   * Can be called both standalone (no `manager`) and within an existing
   * transaction by passing the caller's `EntityManager`.
   *
   * @param pedidoId - UUID of the pedido to transition
   * @param trigger - Trigger that determines the next state (see `PedidoStatusTrigger`)
   * @param manager - Optional EntityManager to participate in a parent transaction
   * @param actorId - ID of the user performing the transition (written to `modifiedBy`)
   * @returns The updated Pedido after the status change
   * @throws NotFoundException if the pedido does not exist
   * @throws BadRequestException if the order is cancelled or the trigger is unsupported
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
   * Soft-deletes a pedido.
   *
   * Only pedidos in `PENDIENTE_DE_APROBACION` or `CANCELADO` state may be deleted.
   *
   * @param id - UUID of the pedido to soft-delete
   * @throws BadRequestException if the order is in a state that prevents deletion
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
