import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
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
import { validateDateRange } from '../../../common/utils/date-range.util';
import { AccionMovimiento } from '../../movimiento/enums/movimiento.enums';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { PedidoStateMachine } from '../state/pedido.state-machine';
import { calculatePedidoFechaEntrega } from '../utils/calculate-pedido-fecha-entrega.util';

/**
 * Servicio encargado de la lógica de negocio para la gestión de pedidos a proveedores.
 * Coordina la creación de pedidos, la gestión de lotes de compra (PurchaseBatch),
 * la sincronización con pedidos de usuario y las transiciones de estado.
 */
@Injectable()
export class PedidoService {
  /**
   * Crea una instancia de PedidoService.
   * @param pedidoRepository Repositorio especializado en pedidos.
   * @param movimientoHelper Ayudante para auditoría de movimientos.
   * @param dataSource Fuente de datos para gestión de transacciones.
   * @param configService Servicio de configuración para parámetros del sistema.
   * @param purchaseBatchService Servicio para gestión de lotes de compra.
   * @param pedidoUsuarioService Servicio para gestión de pedidos de usuario.
   */
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
   * Crea un nuevo pedido integrando sus líneas y calculando costes en una transacción atómica.
   * Reserva un número global correlativo para el pedido.
   * @param createPedidoDto Datos del pedido y sus productos.
   * @param userId ID del usuario creador.
   * @returns El pedido creado con sus relaciones.
   * @throws ConflictException Si falla la creación o validación de precios.
   */
  async create(
    createPedidoDto: CreatePedidoDto,
    userId: string
  ): Promise<Pedido> {
    if (createPedidoDto.idempotencyKey) {
      const existing = await this.dataSource.manager.findOne(Pedido, {
        where: { idempotencyKey: createPedidoDto.idempotencyKey },
      });
      if (existing) {
        return this.findOne(existing.id);
      }
    }

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
        () => calculatePedidoFechaEntrega(this.configService)
      );
      built.pedido.numeroGlobal = await reserveNextPedidoProveedorNumero(
        queryRunner.manager
      );
      built.pedido.modifiedBy = userId;
      if (createPedidoDto.idempotencyKey) {
        built.pedido.idempotencyKey = createPedidoDto.idempotencyKey;
      }

      const savedPedido = await queryRunner.manager.save(Pedido, built.pedido);

      for (const pp of built.pedidoProductos) {
        await queryRunner.manager.save(PedidoProducto, {
          ...pp,
          pedido: { id: savedPedido.id },
          modifiedBy: userId,
        });
      }

      await this.movimientoHelper.trackPedidoCreation(
        userId,
        savedPedido.id,
        I18nHelper.translate('pedidos.movimiento.descripcion_creacion', {
          id: savedPedido.id,
        }),
        { ...built.pedido, id: savedPedido.id },
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

      return this.findOne(savedPedido.id);
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
        I18nHelper.getError('PEDIDO_CREATE_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene una lista paginada de pedidos con filtros aplicados.
   * @param query Parámetros de paginación y búsqueda.
   * @returns Respuesta paginada.
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    validateDateRange(query.fechaDesde, query.fechaHasta, 365, 'Pedidos');
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  /**
   * Busca un pedido por su UUID cargando todas sus relaciones (productos, proveedor, recepciones).
   * @param id UUID del pedido.
   * @returns El pedido encontrado.
   * @throws NotFoundException Si el pedido no existe.
   */
  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  /**
   * Actualiza un pedido, permitiendo modificar el proveedor, observaciones y líneas de producto.
   * Recalcula el coste total si las líneas cambian.
   * @param id UUID del pedido.
   * @param updatePedidoDto Datos a actualizar.
   * @param userId ID del usuario que realiza la modificación.
   * @returns El pedido actualizado.
   */
  async update(
    id: string,
    updatePedidoDto: UpdatePedidoDto,
    userId?: string
  ): Promise<Pedido> {
    const before = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUpdateData: QueryDeepPartialEntity<Pedido> = {};

      const touchesStructuralData =
        updatePedidoDto.lineas !== undefined ||
        updatePedidoDto.proveedorId !== undefined;

      if (touchesStructuralData) {
        if (before.estado !== EstadoPedido.PENDIENTE_DE_APROBACION) {
          throw new BadRequestException(
            I18nHelper.getError('ORDER_UPDATE_FORBIDDEN_STATE')
          );
        }
      }

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

        const existingLineIds = (before.pedidoProductos ?? []).map(
          (pp) => pp.id
        );
        if (existingLineIds.length > 0) {
          const recepcionesVinculadas = await queryRunner.manager.count(
            RecepcionProducto,
            { where: { pedidoProductoId: In(existingLineIds) } }
          );
          if (recepcionesVinculadas > 0) {
            throw new BadRequestException(
              I18nHelper.getError('ORDER_LINES_LOCKED_BY_RECEPTION')
            );
          }
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

      const after = await this.findOne(id);

      if (userId) {
        await this.movimientoHelper.trackAction({
          userId,
          entidad: 'Pedido',
          entidadId: id,
          accion: AccionMovimiento.UPDATE,
          descripcion: `Actualización de pedido ${id}`,
          before,
          after,
        });
      }

      return after;
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
        I18nHelper.getError('PEDIDO_UPDATE_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualiza la fecha estimada de entrega del pedido.
   */
  async updateFechaEntrega(
    id: string,
    dto: UpdatePedidoDto,
    userId?: string
  ): Promise<Pedido> {
    if (dto.fechaEntrega === undefined || dto.fechaEntrega === null) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_FECHA_ENTREGA_REQUIRED')
      );
    }

    const pedido = await this.findOne(id);
    const allowed: EstadoPedido[] = [
      EstadoPedido.PENDIENTE_DE_APROBACION,
      EstadoPedido.POR_RECEPCIONAR,
    ];
    if (!allowed.includes(pedido.estado)) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_UPDATE_FORBIDDEN_STATE')
      );
    }

    const fechaEntrega =
      dto.fechaEntrega instanceof Date
        ? dto.fechaEntrega
        : new Date(String(dto.fechaEntrega));

    if (Number.isNaN(fechaEntrega.getTime())) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_FECHA_ENTREGA_REQUIRED')
      );
    }

    await this.pedidoRepository.update(
      { id },
      {
        fechaEntrega,
        ...(userId ? { modifiedBy: userId } : {}),
      }
    );

    return this.findOne(id);
  }

  /**
   * Cancela un pedido pendiente de aprobación, registrando el motivo.
   * @param id UUID del pedido.
   * @param dto Motivo de cancelación.
   * @param userId Usuario que cancela.
   * @returns El pedido actualizado.
   * @throws BadRequestException Si el pedido no está en estado pendiente o tiene recepciones.
   */
  async cancelarPedido(
    id: string,
    dto: CancelPedidoDto,
    userId?: string
  ): Promise<Pedido> {
    const before = await this.findOne(id);

    if (before.estado !== EstadoPedido.PENDIENTE_DE_APROBACION) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_ONLY_PENDING_CAN_BE_CANCELLED')
      );
    }

    if (before.recepcionesPedido && before.recepcionesPedido.length > 0) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_HAS_RECEPTIONS')
      );
    }

    PedidoStateMachine.applyTransition(before, EstadoPedido.CANCELADO);
    before.motivoCancelacion =
      dto.motivoCancelacion ||
      I18nHelper.translate('pedidos.cancelar.motivoPorDefecto');
    if (userId) {
      before.modifiedBy = userId;
    }
    const after = await this.pedidoRepository.save(before);

    if (userId) {
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Pedido',
        entidadId: id,
        accion: AccionMovimiento.UPDATE,
        descripcion: `Cancelación de pedido ${id}: ${before.motivoCancelacion}`,
        before,
        after,
      });
    }

    return after;
  }

  /**
   * Restaura un pedido cancelado al estado de pendiente de aprobación.
   * @param id UUID del pedido.
   * @param userId Usuario que restaura.
   * @returns El pedido restaurado.
   */
  async restaurarPedido(id: string, userId?: string): Promise<Pedido> {
    const before = await this.findOne(id);

    if (before.estado !== EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_ONLY_CANCELLED_CAN_BE_RESTORED')
      );
    }

    PedidoStateMachine.applyTransition(
      before,
      EstadoPedido.PENDIENTE_DE_APROBACION
    );
    before.motivoCancelacion = undefined;
    if (userId) {
      before.modifiedBy = userId;
    }
    const after = await this.pedidoRepository.save(before);

    if (userId) {
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Pedido',
        entidadId: id,
        accion: AccionMovimiento.UPDATE,
        descripcion: `Restauración de pedido ${id}`,
        before,
        after,
      });
    }

    return after;
  }

  /**
   * Acepta un pedido pendiente, pasándolo al estado de 'Por recepcionar'.
   * @param id UUID del pedido.
   * @param userId Usuario que acepta.
   * @returns El pedido actualizado.
   */
  async aceptarPedido(id: string, userId?: string): Promise<Pedido> {
    return this.handleStatusTransition(
      id,
      PedidoStatusTrigger.ACEPTAR,
      undefined,
      userId
    );
  }

  /**
   * Maneja las transiciones de estado del pedido basándose en disparadores de lógica de negocio.
   * Sincroniza los estados de los lotes y pedidos de usuario relacionados.
   * @param pedidoId UUID del pedido.
   * @param trigger Disparador del cambio de estado.
   * @param manager EntityManager opcional para transacciones anidadas.
   * @param actorId ID del usuario que provoca el cambio.
   * @returns El pedido con su nuevo estado persistido.
   */
  async handleStatusTransition(
    pedidoId: string,
    trigger: PedidoStatusTrigger,
    manager?: EntityManager,
    actorId?: string
  ): Promise<Pedido> {
    const before = manager
      ? await manager.findOne(Pedido, { where: { id: pedidoId } })
      : await this.pedidoRepository.findOneBy({ id: pedidoId });

    if (!before) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    if (before.estado === EstadoPedido.CANCELADO) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANCELLED_CANNOT_TRANSITION')
      );
    }

    const nuevoEstado = this.resolveStatusFromTrigger(trigger);
    PedidoStateMachine.validateTransition(before.estado, nuevoEstado);
    before.estado = nuevoEstado;
    if (actorId) {
      before.modifiedBy = actorId;
    }

    const after = manager
      ? await manager.save(Pedido, before)
      : await this.pedidoRepository.save(before);

    if (after.batchId) {
      await this.purchaseBatchService.syncBatchStatus(
        after.batchId,
        manager,
        actorId
      );
    }

    if (after.pedidoUsuarioId) {
      await this.pedidoUsuarioService.syncPedidoUsuarioStatus(
        after.pedidoUsuarioId,
        manager,
        actorId
      );
    }

    if (actorId) {
      await this.movimientoHelper.trackAction({
        userId: actorId,
        entidad: 'Pedido',
        entidadId: pedidoId,
        accion: AccionMovimiento.UPDATE,
        descripcion: `Cambio de estado de pedido ${pedidoId} a ${after.estado}`,
        before,
        after,
        manager,
      });
    }

    return after;
  }

  /**
   * Elimina lógicamente un pedido si su estado lo permite.
   * @param id UUID del pedido.
   * @throws BadRequestException Si el pedido está en un estado que impide su eliminación (ej: ya recepcionado).
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string, userId?: string): Promise<void> {
    const before = await this.findOne(id);

    if (
      before.estado !== EstadoPedido.PENDIENTE_DE_APROBACION &&
      before.estado !== EstadoPedido.CANCELADO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANNOT_BE_DELETED')
      );
    }

    await this.pedidoRepository.softDelete(id);

    if (userId) {
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Pedido',
        entidadId: id,
        accion: AccionMovimiento.DELETE,
        descripcion: `Eliminación de pedido ${id}`,
        before,
      });
    }
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
