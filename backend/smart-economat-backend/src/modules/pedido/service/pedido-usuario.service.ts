import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In } from 'typeorm';
import { buildPedidoAggregate } from '../../../application/pedido/pedido.factory';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { PedidoUsuarioLinea } from '../pedido-usuario-linea.entity/pedido-usuario-linea.entity';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import {
  CancelPedidoUsuarioDto,
  CreatePedidoUsuarioDto,
  PedidoUsuarioQueryDto,
  UpdatePedidoUsuarioDto,
} from '../dto/pedido-usuario.dto';
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { IncidenciaLinea } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { PurchaseBatchService } from './purchase-batch.service';
import { reserveNextPedidoProveedorNumero } from '../utils/pedido-numero.util';
import { isSherlockElevatedRole } from '../../sherlock-auth/utils/access.utils';

type PendingAggregateLine = {
  productoProveedorId: string;
  cantidad: number;
  observaciones?: string;
  pedidoUsuarioLineaId?: string;
};

/**
 * Servicio responsable del ciclo de vida completo de los pedidos de usuario (PedidoUsuario).
 * Un PedidoUsuario es un agregado que contiene una o más líneas de producto y genera
 * automáticamente sub-pedidos (Pedido) agrupados por proveedor.
 *
 * @class PedidoUsuarioService
 */
@Injectable()
export class PedidoUsuarioService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly purchaseBatchService: PurchaseBatchService
  ) {}

  /**
   * Crea un nuevo PedidoUsuario junto con sus líneas y los sub-pedidos por proveedor.
   * La operación se ejecuta dentro de una transacción; si algún paso falla se hace rollback.
   *
   * @param {CreatePedidoUsuarioDto} dto - Datos del pedido a crear (líneas, observaciones).
   * @param {string} userId - ID del usuario que realiza el pedido.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario creado con todas sus relaciones cargadas.
   * @throws {NotFoundException} Si algún producto-proveedor de las líneas no existe.
   * @throws {BadRequestException} Si el pedido no contiene líneas o los datos son inválidos.
   * @throws {ConflictException} Si ocurre un error inesperado durante la creación.
   */
  async create(
    dto: CreatePedidoUsuarioDto,
    userId: string
  ): Promise<PedidoUsuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUsuario = await this.persistAggregate(
        queryRunner.manager,
        dto,
        userId
      );

      await queryRunner.commitTransaction();
      return this.findOne(pedidoUsuario.id);
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
        `Error al crear el pedido de usuario: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Devuelve una lista paginada de pedidos de usuario con soporte de filtros y ordenación.
   *
   * @param {PedidoUsuarioQueryDto} query - Parámetros de paginación, filtros y orden.
   * @returns {Promise<PaginatedResponseDto<PedidoUsuario>>} Resultado paginado con metadatos.
   */
  async findAll(
    query: PedidoUsuarioQueryDto
  ): Promise<PaginatedResponseDto<PedidoUsuario>> {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(50, Number(query.limit || 20)));
    const order = query.order === 'DESC' ? 'DESC' : 'ASC';
    const sortField =
      query.sortBy &&
      [
        'fechaPedido',
        'fechaEntrega',
        'costeTotal',
        'estado',
        'numeroGlobal',
        'createdAt',
        'updatedAt',
      ].includes(query.sortBy)
        ? query.sortBy
        : 'fechaPedido';

    const qb = this.dataSource
      .getRepository(PedidoUsuario)
      .createQueryBuilder('pedidoUsuario')
      .leftJoinAndSelect('pedidoUsuario.usuario', 'usuario')
      .leftJoinAndSelect('pedidoUsuario.lineas', 'lineas')
      .leftJoinAndSelect('lineas.productoProveedor', 'lineaProductoProveedor')
      .leftJoinAndSelect('lineaProductoProveedor.producto', 'lineaProducto')
      .leftJoinAndSelect('lineaProductoProveedor.proveedor', 'lineaProveedor')
      .leftJoinAndSelect('pedidoUsuario.pedidos', 'pedidos')
      .leftJoinAndSelect('pedidos.batch', 'batch')
      .leftJoinAndSelect('pedidos.proveedor', 'proveedor')
      .leftJoinAndSelect('pedidos.pedidoProductos', 'pedidoProductos')
      .leftJoinAndSelect(
        'pedidoProductos.productoProveedor',
        'pedidoProductoProveedor'
      )
      .leftJoinAndSelect('pedidoProductoProveedor.producto', 'pedidoProducto')
      .where('pedidoUsuario.deletedAt IS NULL');

    if (query.usuarioId) {
      qb.andWhere('pedidoUsuario.usuarioId = :usuarioId', {
        usuarioId: query.usuarioId,
      });
    }

    if (query.estado) {
      const estados = query.estado
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (estados.length === 1) {
        qb.andWhere('pedidoUsuario.estado = :estado', { estado: estados[0] });
      } else if (estados.length > 1) {
        qb.andWhere('pedidoUsuario.estado IN (:...estados)', { estados });
      }
    }

    if (query.fechaDesde) {
      qb.andWhere('pedidoUsuario.fechaPedido >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('pedidoUsuario.fechaPedido <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    if (query.searchTerm?.trim()) {
      const searchTerm = `%${query.searchTerm.trim()}%`;
      qb.andWhere(
        `(
          CAST(pedidoUsuario.numeroGlobal AS TEXT) ILIKE :searchTerm
          OR pedidoUsuario.observaciones ILIKE :searchTerm
          OR usuario.nombre ILIKE :searchTerm
          OR usuario.username ILIKE :searchTerm
          OR usuario.email ILIKE :searchTerm
          OR proveedor.nombre ILIKE :searchTerm
        )`,
        { searchTerm }
      );
    }

    qb.orderBy(`pedidoUsuario.${sortField}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .distinct(true);

    const [data, total] = await qb.getManyAndCount();
    await this.annotateLinkedMovements(
      data.flatMap((item) => item.pedidos || [])
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Obtiene un PedidoUsuario por su ID con todas sus relaciones cargadas.
   *
   * @param {string} id - ID del pedido de usuario.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario encontrado.
   * @throws {NotFoundException} Si no existe un pedido con el ID proporcionado.
   */
  async findOne(id: string): Promise<PedidoUsuario> {
    const pedidoUsuario = await this.dataSource
      .getRepository(PedidoUsuario)
      .findOne({
        where: { id },
        relations: [
          'usuario',
          'lineas',
          'lineas.productoProveedor',
          'lineas.productoProveedor.producto',
          'lineas.productoProveedor.proveedor',
          'pedidos',
          'pedidos.batch',
          'pedidos.proveedor',
          'pedidos.pedidoProductos',
          'pedidos.pedidoProductos.productoProveedor',
          'pedidos.pedidoProductos.productoProveedor.producto',
          'pedidos.pedidoProductos.productoProveedor.proveedor',
        ],
      });

    if (!pedidoUsuario) {
      throw new NotFoundException(`Pedido de usuario #${id} no encontrado`);
    }

    await this.annotateLinkedMovements(pedidoUsuario.pedidos || []);
    return pedidoUsuario;
  }

  /**
   * Actualiza un PedidoUsuario existente reemplazando sus líneas y sub-pedidos.
   * Solo permite editar pedidos en estado PENDIENTE sin movimientos o recepciones asociadas.
   * La operación elimina los sub-pedidos anteriores y los recrea desde cero.
   *
   * @param {string} id - ID del pedido de usuario a actualizar.
   * @param {UpdatePedidoUsuarioDto} dto - Nuevos datos del pedido (líneas, observaciones).
   * @param {string} [userId] - ID del usuario que realiza la modificación.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario actualizado.
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {BadRequestException} Si el pedido no es editable o tiene referencias vinculadas.
   * @throws {ConflictException} Si ocurre un error inesperado durante la actualización.
   */
  async update(
    id: string,
    dto: UpdatePedidoUsuarioDto,
    userId?: string
  ): Promise<PedidoUsuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(PedidoUsuario, {
        where: { id },
        relations: ['pedidos', 'pedidos.pedidoProductos', 'lineas'],
      });

      if (!existing) {
        throw new NotFoundException(`Pedido de usuario #${id} no encontrado`);
      }

      this.assertEditable(existing);

      const childPedidoIds = (existing.pedidos || []).map(
        (pedido) => pedido.id
      );
      const childLineIds = (existing.pedidos || []).flatMap((pedido) =>
        (pedido.pedidoProductos || []).map((line) => line.id)
      );

      if (
        await this.hasLinkedReferences(
          queryRunner.manager,
          childPedidoIds,
          childLineIds
        )
      ) {
        throw new BadRequestException(
          'No se puede editar el pedido porque ya tiene movimientos o recepciones asociadas.'
        );
      }

      if (childLineIds.length > 0) {
        await queryRunner.manager.delete(PedidoProducto, {
          id: In(childLineIds),
        });
      }
      if (childPedidoIds.length > 0) {
        await queryRunner.manager.delete(Pedido, { id: In(childPedidoIds) });
      }
      if ((existing.lineas || []).length > 0) {
        await queryRunner.manager.delete(PedidoUsuarioLinea, {
          pedidoUsuarioId: existing.id,
        });
      }

      const nuevaFechaEntrega = this.calculateFechaEntrega();
      existing.observaciones = dto.observaciones;
      existing.fechaEntrega = nuevaFechaEntrega;
      existing.modifiedBy = userId || existing.modifiedBy || existing.usuarioId;
      existing.lineas = [];
      existing.pedidos = [];

      await queryRunner.manager.update(PedidoUsuario, existing.id, {
        observaciones: dto.observaciones,
        fechaEntrega: nuevaFechaEntrega,
        modifiedBy: existing.modifiedBy,
      });

      await this.persistAggregateLinesAndPedidos(
        queryRunner.manager,
        existing,
        dto,
        existing.usuarioId || ''
      );
      await this.syncPedidoUsuarioStatus(
        existing.id,
        queryRunner.manager,
        userId
      );

      await queryRunner.commitTransaction();
      return this.findOne(existing.id);
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
        `Error al actualizar el pedido de usuario: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Aprueba un PedidoUsuario delegando en PurchaseBatchService para crear el lote de compra.
   *
   * @param {string} id - ID del pedido de usuario a aprobar.
   * @param {string} userId - ID del usuario que aprueba el pedido.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario con su estado actualizado.
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {BadRequestException} Si el pedido no se encuentra en estado aprobable.
   */
  async accept(id: string, userId: string): Promise<PedidoUsuario> {
    await this.purchaseBatchService.approvePedidoUsuario(id, userId);
    return this.findOne(id);
  }

  /**
   * Cancela un PedidoUsuario y todos sus sub-pedidos en estado pendiente.
   *
   * @param {string} id - ID del pedido de usuario a cancelar.
   * @param {CancelPedidoUsuarioDto} dto - Datos de cancelación, incluido el motivo opcional.
   * @param {string} [userId] - ID del usuario que cancela el pedido.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario con estado CANCELADO.
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {BadRequestException} Si el pedido ya tiene recepciones registradas.
   */
  async cancel(
    id: string,
    dto: CancelPedidoUsuarioDto,
    userId?: string
  ): Promise<PedidoUsuario> {
    const motivo = dto.motivoCancelacion || 'Cancelado por el usuario';

    return this.changePendingAggregateStatus(
      id,
      (pedido) => {
        pedido.estado = EstadoPedido.CANCELADO;
        pedido.motivoCancelacion = motivo;
      },
      false,
      userId
    );
  }

  /**
   * Restaura un PedidoUsuario previamente cancelado al estado PENDIENTE_DE_APROBACION.
   *
   * @param {string} id - ID del pedido de usuario a restaurar.
   * @param {string} [userId] - ID del usuario que restaura el pedido.
   * @returns {Promise<PedidoUsuario>} El pedido de usuario restaurado.
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {BadRequestException} Si algún sub-pedido no está en estado CANCELADO.
   */
  async restore(id: string, userId?: string): Promise<PedidoUsuario> {
    return this.changePendingAggregateStatus(
      id,
      (pedido) => {
        if (pedido.estado !== EstadoPedido.CANCELADO) {
          throw new BadRequestException(
            'Solo se pueden restaurar los pedidos que estén en estado cancelado.'
          );
        }
        pedido.estado = EstadoPedido.PENDIENTE_DE_APROBACION;
        pedido.motivoCancelacion = undefined;
      },
      true,
      userId
    );
  }

  /**
   * Elimina (soft delete) un PedidoUsuario y todos sus sub-pedidos.
   * Solo el propietario o un usuario con rol elevado puede eliminar el pedido.
   *
   * @param {string} id - ID del pedido de usuario a eliminar.
   * @param {{ id: string; rol?: string }} user - Usuario que realiza la eliminación.
   * @returns {Promise<void>}
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {ForbiddenException} Si el usuario no es el propietario ni tiene rol elevado.
   * @throws {BadRequestException} Si el pedido no se encuentra en estado editable.
   * @throws {ConflictException} Si ocurre un error inesperado durante la eliminación.
   */
  async remove(id: string, user: { id: string; rol?: string }): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUsuario = await queryRunner.manager.findOne(PedidoUsuario, {
        where: { id },
        relations: ['pedidos', 'lineas'],
      });

      if (!pedidoUsuario) {
        throw new NotFoundException(`Pedido de usuario #${id} no encontrado`);
      }

      const isElevated = isSherlockElevatedRole(user.rol);
      if (!isElevated && pedidoUsuario.usuarioId !== user.id) {
        throw new ForbiddenException(
          'No tienes permisos para eliminar este pedido porque no eres el propietario.'
        );
      }

      this.assertEditable(pedidoUsuario);

      pedidoUsuario.deletedBy = user.id;

      if (pedidoUsuario.pedidos?.length) {
        for (const pedido of pedidoUsuario.pedidos) {
          pedido.deletedBy = user.id;
          await queryRunner.manager.softRemove(Pedido, pedido);
        }
      }

      await queryRunner.manager.softRemove(PedidoUsuario, pedidoUsuario);
      await queryRunner.commitTransaction();
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new ConflictException(
        `Error al eliminar el pedido de usuario: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Recalcula y persiste el estado agregado del PedidoUsuario basándose en el estado
   * de sus sub-pedidos. Se llama tras cualquier operación que pueda cambiar dicho estado.
   *
   * @param {string} pedidoUsuarioId - ID del pedido de usuario a sincronizar.
   * @param {EntityManager} [manager] - EntityManager de transacción activa (opcional).
   * @param {string} [actorId] - ID del usuario que provoca el cambio (para auditoría).
   * @returns {Promise<void>}
   */
  async syncPedidoUsuarioStatus(
    pedidoUsuarioId: string,
    manager?: EntityManager,
    actorId?: string
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(PedidoUsuario)
      : this.dataSource.getRepository(PedidoUsuario);

    const pedidoUsuario = await repo.findOne({
      where: { id: pedidoUsuarioId },
      relations: ['pedidos'],
    });

    if (!pedidoUsuario) {
      return;
    }

    const nuevoEstado = await this.calculateAggregateStatus(
      pedidoUsuario,
      manager
    );
    if (pedidoUsuario.estado !== nuevoEstado) {
      pedidoUsuario.estado = nuevoEstado;
      if (actorId) {
        pedidoUsuario.modifiedBy = actorId;
      }
      await repo.save(pedidoUsuario);
    }
  }

  /**
   * Cambia el estado de los sub-pedidos (Pedido) de un PedidoUsuario aplicando una
   * función de mutación sobre cada uno. Se usa para operaciones de cancelación y restauración.
   *
   * @param {string} id - ID del pedido de usuario.
   * @param {(pedido: Pedido) => Promise<void> | void} mutatePedido - Función que muta el estado de un sub-pedido.
   * @param {boolean} [force=false] - Si es `true`, omite la validación de estado editable.
   * @param {string} [actorId] - ID del usuario que realiza la acción (para auditoría).
   * @returns {Promise<PedidoUsuario>} El pedido de usuario con estados actualizados.
   * @throws {NotFoundException} Si el pedido no existe.
   * @throws {BadRequestException} Si el pedido tiene recepciones registradas o no es modificable.
   * @throws {ConflictException} Si ocurre un error inesperado.
   */
  private async changePendingAggregateStatus(
    id: string,
    mutatePedido: (pedido: Pedido) => Promise<void> | void,
    force = false,
    actorId?: string
  ): Promise<PedidoUsuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoUsuario = await queryRunner.manager.findOne(PedidoUsuario, {
        where: { id },
        relations: ['pedidos', 'pedidos.recepcionesPedido'],
      });

      if (!pedidoUsuario) {
        throw new NotFoundException(`Pedido de usuario #${id} no encontrado`);
      }

      if (!force) {
        this.assertEditable(pedidoUsuario);
      }

      const hasRecepciones = (pedidoUsuario.pedidos || []).some(
        (pedido) => (pedido.recepcionesPedido || []).length > 0
      );

      if (hasRecepciones) {
        throw new BadRequestException(
          'No se puede modificar el estado del pedido porque ya tiene recepciones registradas.'
        );
      }

      for (const pedido of pedidoUsuario.pedidos || []) {
        await mutatePedido(pedido);
        if (actorId) {
          pedido.modifiedBy = actorId;
        }
        await queryRunner.manager.save(Pedido, pedido);
      }

      if (actorId) {
        pedidoUsuario.modifiedBy = actorId;
      }

      await this.syncPedidoUsuarioStatus(
        pedidoUsuario.id,
        queryRunner.manager,
        actorId
      );
      await queryRunner.commitTransaction();
      return this.findOne(pedidoUsuario.id);
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
        `Error al actualizar el estado del pedido de usuario: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crea y persiste el agregado PedidoUsuario con sus líneas y sub-pedidos.
   *
   * @param {EntityManager} manager - EntityManager de la transacción activa.
   * @param {CreatePedidoUsuarioDto} dto - Datos del pedido a crear.
   * @param {string} userId - ID del usuario creador.
   * @returns {Promise<PedidoUsuario>} El PedidoUsuario persistido (sin relaciones cargadas).
   * @throws {BadRequestException} Si no hay líneas en el DTO.
   * @throws {NotFoundException} Si algún producto-proveedor no existe.
   */
  private async persistAggregate(
    manager: EntityManager,
    dto: CreatePedidoUsuarioDto,
    userId: string
  ): Promise<PedidoUsuario> {
    const pedidoUsuario = manager.create(PedidoUsuario, {
      usuarioId: userId,
      observaciones: dto.observaciones,
      fechaEntrega: this.calculateFechaEntrega(),
      estado: EstadoPedidoUsuario.PENDIENTE,
      costeTotal: 0,
      modifiedBy: userId,
    });

    const savedPedidoUsuario = await manager.save(PedidoUsuario, pedidoUsuario);
    await this.persistAggregateLinesAndPedidos(
      manager,
      savedPedidoUsuario,
      dto,
      userId
    );
    await this.syncPedidoUsuarioStatus(savedPedidoUsuario.id, manager, userId);

    return savedPedidoUsuario;
  }

  /**
   * Crea las líneas del PedidoUsuario y genera los sub-pedidos (Pedido) agrupados por proveedor.
   * Actualiza el coste total del PedidoUsuario tras procesar todas las líneas.
   *
   * @param {EntityManager} manager - EntityManager de la transacción activa.
   * @param {PedidoUsuario} pedidoUsuario - Instancia del PedidoUsuario al que se asociarán las líneas.
   * @param {CreatePedidoUsuarioDto} dto - DTO con las líneas de pedido.
   * @param {string} userId - ID del usuario creador/modificador.
   * @returns {Promise<void>}
   * @throws {BadRequestException} Si el DTO no contiene líneas.
   * @throws {NotFoundException} Si algún producto-proveedor no existe.
   * @throws {ConflictException} Si algún producto-proveedor no tiene precio configurado.
   */
  private async persistAggregateLinesAndPedidos(
    manager: EntityManager,
    pedidoUsuario: PedidoUsuario,
    dto: CreatePedidoUsuarioDto,
    userId: string
  ): Promise<void> {
    if (!dto.lineas?.length) {
      throw new BadRequestException(
        'El pedido de usuario debe contener al menos una línea.'
      );
    }

    const productIds = dto.lineas.map((linea) => linea.productoProveedorId);
    const productProviders = await manager.find(ProductoProveedor, {
      where: { id: In(productIds) },
      relations: ['proveedor'],
    });

    const productProviderMap = new Map(
      productProviders.map((productProvider) => [
        productProvider.id,
        productProvider,
      ])
    );

    const lineasPorProveedor = new Map<string, PendingAggregateLine[]>();
    let costeTotal = 0;

    for (const linea of dto.lineas) {
      const productProvider = productProviderMap.get(linea.productoProveedorId);
      if (!productProvider) {
        throw new NotFoundException(
          `No se encontró el producto-proveedor con ID ${linea.productoProveedorId}`
        );
      }

      const precioUnitario = Number(productProvider.precioUnitario);
      if (!Number.isFinite(precioUnitario)) {
        throw new ConflictException(
          `El producto-proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente configurado.`
        );
      }

      const aggregateLine = manager.create(PedidoUsuarioLinea, {
        pedidoUsuarioId: pedidoUsuario.id,
        productoProveedorId: linea.productoProveedorId,
        cantidad: linea.cantidad,
        precioUnitario,
      });
      const savedAggregateLine = await manager.save(
        PedidoUsuarioLinea,
        aggregateLine
      );

      costeTotal += Number(linea.cantidad) * precioUnitario;

      const proveedorId = productProvider.proveedorId;
      if (!lineasPorProveedor.has(proveedorId)) {
        lineasPorProveedor.set(proveedorId, []);
      }

      lineasPorProveedor.get(proveedorId)?.push({
        productoProveedorId: linea.productoProveedorId,
        cantidad: linea.cantidad,
        pedidoUsuarioLineaId: savedAggregateLine.id,
      });
    }

    pedidoUsuario.costeTotal = Number(costeTotal.toFixed(4));
    await manager.update(PedidoUsuario, pedidoUsuario.id, {
      costeTotal: pedidoUsuario.costeTotal,
      modifiedBy: userId,
    });

    for (const [proveedorId, lineas] of lineasPorProveedor.entries()) {
      const createPedidoDto: CreatePedidoDto = {
        proveedorId,
        observaciones: dto.observaciones,
        lineas: lineas.map((linea) => ({
          productoProveedorId: linea.productoProveedorId,
          cantidad: linea.cantidad,
        })),
      };

      const built = await buildPedidoAggregate(
        manager,
        createPedidoDto,
        userId,
        EstadoPedido.PENDIENTE_DE_APROBACION,
        () => this.calculateFechaEntrega()
      );

      built.pedido.numeroGlobal =
        await reserveNextPedidoProveedorNumero(manager);
      built.pedido.pedidoUsuarioId = pedidoUsuario.id;
      built.pedido.fechaPedido = pedidoUsuario.fechaPedido;
      built.pedido.fechaEntrega = pedidoUsuario.fechaEntrega;
      built.pedido.observaciones = dto.observaciones;
      built.pedido.modifiedBy = userId;
      const savedPedido = await manager.save(Pedido, built.pedido);

      const queueByProductProvider = new Map<string, string[]>();
      for (const linea of lineas) {
        const existingQueue =
          queueByProductProvider.get(linea.productoProveedorId) || [];
        existingQueue.push(linea.pedidoUsuarioLineaId || '');
        queueByProductProvider.set(linea.productoProveedorId, existingQueue);
      }

      for (const pedidoProducto of built.pedidoProductos) {
        const queue = queueByProductProvider.get(
          pedidoProducto.productoProveedorId || ''
        );
        const pedidoUsuarioLineaId = queue?.shift();

        await manager.insert(PedidoProducto, {
          pedidoId: savedPedido.id,
          productoProveedorId: pedidoProducto.productoProveedorId,
          ...(pedidoUsuarioLineaId ? { pedidoUsuarioLineaId } : {}),
          cantidad: pedidoProducto.cantidad,
          precioUnitario: pedidoProducto.precioUnitario,
          observaciones: pedidoProducto.observaciones,
          modifiedBy: userId,
        });
      }

      await this.movimientoHelper.trackPedidoCreation(
        userId,
        savedPedido.id,
        `Pedido #${savedPedido.id} (Pedido usuario #${pedidoUsuario.id})`
      );
    }
  }

  /**
   * Determina el estado agregado de un PedidoUsuario en función del estado de sus sub-pedidos
   * y de si pertenecen a uno o varios lotes de compra.
   *
   * @param {PedidoUsuario} pedidoUsuario - Instancia del PedidoUsuario con relación `pedidos` cargada.
   * @param {EntityManager} [manager] - EntityManager opcional para consultas dentro de una transacción.
   * @returns {Promise<EstadoPedidoUsuario>} Estado calculado del agregado.
   */
  private async calculateAggregateStatus(
    pedidoUsuario: PedidoUsuario,
    manager?: EntityManager
  ): Promise<EstadoPedidoUsuario> {
    const pedidos = pedidoUsuario.pedidos || [];

    if (pedidos.length === 0) {
      return EstadoPedidoUsuario.PENDIENTE;
    }

    if (pedidos.every((pedido) => pedido.estado === EstadoPedido.CANCELADO)) {
      return EstadoPedidoUsuario.CANCELADO;
    }

    const batchIds = Array.from(
      new Set(
        pedidos
          .map((pedido) => pedido.batchId)
          .filter((batchId): batchId is string => Boolean(batchId))
      )
    );

    if (batchIds.length === 0) {
      return EstadoPedidoUsuario.PENDIENTE;
    }

    if (pedidoUsuario.estado === EstadoPedidoUsuario.CONSOLIDADO) {
      return EstadoPedidoUsuario.CONSOLIDADO;
    }

    if (pedidoUsuario.estado === EstadoPedidoUsuario.APROBADO) {
      return EstadoPedidoUsuario.APROBADO;
    }

    if (batchIds.length > 1) {
      return EstadoPedidoUsuario.CONSOLIDADO;
    }

    const pedidoRepo = manager
      ? manager.getRepository(Pedido)
      : this.dataSource.getRepository(Pedido);
    const pedidosDelLote = await pedidoRepo.find({
      where: { batchId: batchIds[0] },
      select: ['pedidoUsuarioId'],
    });
    const pedidoUsuarioIds = new Set(
      pedidosDelLote
        .map((pedido) => pedido.pedidoUsuarioId)
        .filter((value): value is string => Boolean(value))
    );

    return pedidoUsuarioIds.size > 1
      ? EstadoPedidoUsuario.CONSOLIDADO
      : EstadoPedidoUsuario.APROBADO;
  }

  /**
   * Verifica si alguno de los sub-pedidos o sus líneas tiene recepciones o incidencias vinculadas.
   * Se usa para bloquear la edición de pedidos con historial de operaciones.
   *
   * @param {EntityManager} manager - EntityManager de la transacción activa.
   * @param {string[]} pedidoIds - IDs de los sub-pedidos a verificar.
   * @param {string[]} pedidoProductoIds - IDs de las líneas de pedido a verificar.
   * @returns {Promise<boolean>} `true` si existe al menos una referencia vinculada.
   */
  private async hasLinkedReferences(
    manager: EntityManager,
    pedidoIds: string[],
    pedidoProductoIds: string[]
  ): Promise<boolean> {
    const [recepcionesPedidoCount, recepcionesProductoCount, incidenciasCount] =
      await Promise.all([
        pedidoIds.length > 0
          ? manager.count(RecepcionPedido, {
              where: { pedidoId: In(pedidoIds) },
            })
          : Promise.resolve(0),
        pedidoProductoIds.length > 0
          ? manager.count(RecepcionProducto, {
              where: { pedidoProductoId: In(pedidoProductoIds) },
            })
          : Promise.resolve(0),
        pedidoProductoIds.length > 0
          ? manager.count(IncidenciaLinea, {
              where: { pedidoProductoId: In(pedidoProductoIds) },
            })
          : Promise.resolve(0),
      ]);

    return (
      recepcionesPedidoCount > 0 ||
      recepcionesProductoCount > 0 ||
      incidenciasCount > 0
    );
  }

  /**
   * Verifica que el PedidoUsuario y todos sus sub-pedidos están en estado editable.
   * Lanza BadRequestException si el estado no permite modificaciones.
   *
   * @param {PedidoUsuario} pedidoUsuario - Instancia del PedidoUsuario con relación `pedidos` cargada.
   * @throws {BadRequestException} Si el pedido de usuario no está en estado PENDIENTE.
   * @throws {BadRequestException} Si algún sub-pedido no está en estado PENDIENTE_DE_APROBACION.
   */
  private assertEditable(pedidoUsuario: PedidoUsuario): void {
    if (pedidoUsuario.estado !== EstadoPedidoUsuario.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden modificar pedidos de usuario pendientes.'
      );
    }

    const invalidChild = (pedidoUsuario.pedidos || []).find(
      (pedido) => pedido.estado !== EstadoPedido.PENDIENTE_DE_APROBACION
    );
    if (invalidChild) {
      throw new BadRequestException(
        'Solo se pueden modificar pedidos de usuario cuyos pedidos internos sigan pendientes.'
      );
    }
  }

  /**
   * Enriquece las líneas de producto de los sub-pedidos con la propiedad `hasLinkedMovements`,
   * indicando si tienen recepciones o incidencias asociadas. Se usa para la UI de detalle.
   *
   * @param {Pedido[]} pedidos - Lista de sub-pedidos con relación `pedidoProductos` cargada.
   * @returns {Promise<void>}
   */
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

  /**
   * Calcula la fecha de entrega estimada sumando las horas configuradas en
   * la variable de entorno `PEDIDO_FECHA_ENTREGA_HOURS` (por defecto 48 h).
   *
   * @param {Date} [baseDate=new Date()] - Fecha base desde la que calcular.
   * @returns {Date} Fecha de entrega calculada.
   */
  private calculateFechaEntrega(baseDate = new Date()): Date {
    const hours = this.configService.get<number>(
      'PEDIDO_FECHA_ENTREGA_HOURS',
      48
    );
    return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
  }
}
