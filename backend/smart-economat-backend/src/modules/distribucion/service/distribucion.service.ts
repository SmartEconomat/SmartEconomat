/**
 * @module DistribucionService
 * Service layer for managing stock distributions between warehouse locations.
 * Handles listing, retrieval, availability computation, creation, confirmation
 * (with FEFO stock transfer) and cancellation of Distribucion records.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { isSherlockElevatedRole } from '../../sherlock-auth/utils/access.utils';
import { Distribucion } from '../distribucion.entity/distribucion.entity';
import { DistribucionLinea } from '../distribucion-linea.entity/distribucion-linea.entity';
import {
  EstadoDistribucion,
  EstadoDistribucionLinea,
} from '../enums/estado-distribucion.enum';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { CancelDistribucionDto } from '../dto/cancel-distribucion.dto';
import {
  DistribucionDisponibleDto,
  DistribucionDisponibleLineaDto,
} from '../dto/distribucion-disponible.dto';
import { PedidoUsuario } from '../../pedido/pedido-usuario.entity/pedido-usuario.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { DataSource } from 'typeorm';
import { permiteComputarComoRecibido } from '../../recepcion/utils/recepcion-producto-state.util';

/**
 * Service responsible for the distribution workflow:
 * preparing distributions from warehouse to classroom/slot locations,
 * confirming them (which moves stock via FEFO), and cancelling them.
 * @class DistribucionService
 */
@Injectable()
export class DistribucionService {
  /**
   * Constructs the DistribucionService with its required dependencies.
   * @param {Repository<Distribucion>} distribucionRepository - Repository for Distribucion entities.
   * @param {Repository<DistribucionLinea>} distribucionLineaRepository - Repository for DistribucionLinea entities.
   * @param {Repository<PedidoUsuario>} pedidoUsuarioRepository - Repository for user orders (pedidosUsuario).
   * @param {Repository<RecepcionProducto>} recepcionProductoRepository - Repository for received product lines.
   * @param {Repository<Ubicacion>} ubicacionRepository - Repository for warehouse location entities.
   * @param {Repository<AlumnoSlot>} alumnoSlotRepository - Repository for student classroom slots.
   * @param {Repository<Inventario>} inventarioRepository - Repository for stock inventory records.
   * @param {Repository<Movimiento>} movimientoRepository - Repository for stock movement audit records.
   * @param {DataSource} dataSource - TypeORM DataSource used to run transactions.
   */
  constructor(
    @InjectRepository(Distribucion)
    private readonly distribucionRepository: Repository<Distribucion>,
    @InjectRepository(DistribucionLinea)
    private readonly distribucionLineaRepository: Repository<DistribucionLinea>,
    @InjectRepository(PedidoUsuario)
    private readonly pedidoUsuarioRepository: Repository<PedidoUsuario>,
    @InjectRepository(RecepcionProducto)
    private readonly recepcionProductoRepository: Repository<RecepcionProducto>,
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepository: Repository<Ubicacion>,
    @InjectRepository(AlumnoSlot)
    private readonly alumnoSlotRepository: Repository<AlumnoSlot>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Returns a paginated, filterable list of distributions with their associated entities.
   * Admin roles also see soft-deleted records. Supports search by order number, user,
   * destination location, product name, and filter by estado.
   * @param {PaginationQueryDto} query - Pagination, search and estado filter parameters.
   * @param {string} [userRole] - Role of the requesting user.
   * @returns {Promise<PaginatedResponseDto<Distribucion>>} Paginated distributions.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Distribucion>> {
    const isAdmin = isSherlockElevatedRole(userRole);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const qb = this.distribucionRepository
      .createQueryBuilder('distribucion')
      .leftJoinAndSelect('distribucion.pedidoUsuario', 'pedidoUsuario')
      .leftJoinAndSelect('pedidoUsuario.usuario', 'usuario')
      .leftJoinAndSelect('distribucion.ubicacionOrigen', 'ubicacionOrigen')
      .leftJoinAndSelect('distribucion.ubicacionDestino', 'ubicacionDestino')
      .leftJoinAndSelect('distribucion.alumnoSlot', 'alumnoSlot')
      .leftJoinAndSelect('alumnoSlot.ubicacion', 'slotUbicacion')
      .leftJoinAndSelect('distribucion.lineas', 'lineas')
      .leftJoinAndSelect('lineas.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .orderBy('distribucion.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (isAdmin) {
      qb.withDeleted();
    }

    if (query.searchTerm?.trim()) {
      const search = `%${query.searchTerm.trim()}%`;
      qb.andWhere(
        '(CAST(pedidoUsuario.numeroGlobal AS TEXT) ILIKE :search OR usuario.nombre ILIKE :search OR usuario.username ILIKE :search OR ubicacionDestino.nombre ILIKE :search OR producto.nombre ILIKE :search)',
        { search }
      );
    }

    if (query.estado?.trim()) {
      qb.andWhere('distribucion.estado = :estado', {
        estado: query.estado.trim(),
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single distribution by its UUID with all detail relations loaded.
   * @param {string} id - UUID of the distribution to retrieve.
   * @param {string} [userRole] - Role of the requesting user; admins can retrieve soft-deleted records.
   * @returns {Promise<Distribucion>} The found Distribucion entity with all relations.
   * @throws {NotFoundException} If no distribution with the given ID exists.
   */
  async findOne(id: string, userRole?: string): Promise<Distribucion> {
    const isAdmin = isSherlockElevatedRole(userRole);
    const distribucion = await this.distribucionRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: [
        'pedidoUsuario',
        'pedidoUsuario.usuario',
        'pedidoUsuario.usuario.alumno',
        'pedidoUsuario.usuario.alumno.slot',
        'pedidoUsuario.usuario.alumno.slot.ubicacion',
        'ubicacionOrigen',
        'ubicacionDestino',
        'alumnoSlot',
        'alumnoSlot.ubicacion',
        'lineas',
        'lineas.pedidoUsuarioLinea',
        'lineas.pedidoUsuarioLinea.productoProveedor',
        'lineas.pedidoUsuarioLinea.productoProveedor.producto',
        'lineas.productoProveedor',
        'lineas.productoProveedor.producto',
      ],
    });

    if (!distribucion) {
      throw new NotFoundException(
        I18nHelper.getError('DISTRIBUCION_NOT_FOUND')
      );
    }

    return distribucion;
  }

  /**
   * Returns the list of user orders (pedidosUsuario) that have at least one product
   * line with pending quantity to distribute (received but not yet distributed).
   * Results are enriched with slot/location suggestions and pending quantity summaries.
   * @param {PaginationQueryDto} query - Pagination and optional search term parameters.
   * @returns {Promise<DistribucionDisponibleDto[]>} Array of distributable order summaries.
   */
  async findDisponibles(
    query: PaginationQueryDto
  ): Promise<DistribucionDisponibleDto[]> {
    const limit = Math.min(query.limit ?? 50, 100);

    const qb = this.pedidoUsuarioRepository
      .createQueryBuilder('pedidoUsuario')
      .distinct(true)
      .leftJoinAndSelect('pedidoUsuario.usuario', 'usuario')
      .leftJoinAndSelect('usuario.alumno', 'alumno')
      .leftJoinAndSelect('alumno.slot', 'slot')
      .leftJoinAndSelect('slot.ubicacion', 'slotUbicacion')
      .leftJoinAndSelect('usuario.profesor', 'profesor')
      .leftJoinAndSelect('profesor.slots', 'profesorSlot')
      .leftJoinAndSelect('profesorSlot.ubicacion', 'profesorSlotUbicacion')
      .leftJoinAndSelect(
        'pedidoUsuario.ubicacionEntregaSugerida',
        'ubicacionSugerida'
      )
      .leftJoinAndSelect('pedidoUsuario.lineas', 'lineas')
      .leftJoinAndSelect('lineas.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .orderBy('pedidoUsuario.createdAt', 'DESC')
      .take(limit);

    if (query.searchTerm?.trim()) {
      const search = `%${query.searchTerm.trim()}%`;
      qb.where(
        '(CAST(pedidoUsuario.numeroGlobal AS TEXT) ILIKE :search OR usuario.nombre ILIKE :search OR usuario.username ILIKE :search OR slot.aula ILIKE :search OR profesorSlot.aula ILIKE :search)',
        { search }
      );
    }

    const pedidosUsuario = await qb.getMany();
    const disponibles: DistribucionDisponibleDto[] = [];

    for (const pedidoUsuario of pedidosUsuario) {
      const disponible = await this.buildDistribucionDisponible(pedidoUsuario);
      if (disponible.lineas.length > 0) {
        disponibles.push(disponible);
      }
    }

    return disponibles;
  }

  /**
   * Creates a new distribution in PREPARADA state inside a transaction.
   * Validates that:
   * - No duplicate lines are included.
   * - The referenced pedidoUsuario exists.
   * - The origin location exists (or defaults to "Almacén Principal").
   * - The destination location can be resolved from the DTO or the student slot.
   * - The origin and destination are different.
   * - Each requested line quantity does not exceed the available pending quantity.
   * @param {CreateDistribucionDto} dto - Payload describing the distribution to create.
   * @param {string} userId - ID of the authenticated user creating the distribution.
   * @returns {Promise<Distribucion>} The newly created Distribucion with all relations.
   * @throws {BadRequestException} If any validation rule is violated.
   * @throws {NotFoundException} If the pedidoUsuario, origin or destination location is not found.
   */
  async create(
    dto: CreateDistribucionDto,
    userId: string
  ): Promise<Distribucion> {
    return this.dataSource.transaction(async (manager) => {
      const requestedLineIds = dto.lineas.map(
        (linea) => linea.pedidoUsuarioLineaId
      );
      const uniqueRequestedLineIds = new Set(requestedLineIds);

      if (uniqueRequestedLineIds.size !== requestedLineIds.length) {
        throw new BadRequestException(
          I18nHelper.getError('DISTRIBUCION_DUPLICATE_LINES')
        );
      }

      const pedidoUsuario = await manager.findOne(PedidoUsuario, {
        where: { id: dto.pedidoUsuarioId },
        relations: [
          'usuario',
          'usuario.alumno',
          'usuario.alumno.slot',
          'usuario.alumno.slot.ubicacion',
          'lineas',
          'lineas.productoProveedor',
          'lineas.productoProveedor.producto',
        ],
      });

      if (!pedidoUsuario) {
        throw new NotFoundException(
          I18nHelper.getError('PEDIDO_USUARIO_NOT_FOUND')
        );
      }

      const origen = await this.resolveOrigen(manager, dto.ubicacionOrigenId);
      const targetSlot = await this.resolveTargetSlot(
        manager,
        dto,
        pedidoUsuario
      );
      const destino = await this.resolveDestino(manager, dto, targetSlot);

      if (origen.id === destino.id) {
        throw new BadRequestException(
          I18nHelper.getError('DISTRIBUCION_DEST_SAME_AS_ORIGIN')
        );
      }

      const aggregateData = await this.calculatePendingByPedidoUsuarioLinea(
        manager,
        requestedLineIds
      );
      const pedidoLineas = new Map(
        (pedidoUsuario.lineas || []).map((linea) => [linea.id, linea])
      );

      const distribucion = manager.create(Distribucion, {
        pedidoUsuario,
        usuarioResponsable: { id: userId } as any,
        ubicacionOrigen: origen,
        ubicacionDestino: destino,
        ...(targetSlot ? { alumnoSlot: targetSlot } : {}),
        estado: EstadoDistribucion.PREPARADA,
        observaciones: dto.observaciones,
        modifiedBy: userId,
      });

      distribucion.lineas = dto.lineas.map((lineaDto) => {
        const pedidoUsuarioLinea = pedidoLineas.get(
          lineaDto.pedidoUsuarioLineaId
        );
        if (!pedidoUsuarioLinea) {
          throw new BadRequestException(
            I18nHelper.getError('DISTRIBUCION_LINE_NOT_FROM_ORDER')
          );
        }

        const aggregate = aggregateData.get(lineaDto.pedidoUsuarioLineaId);
        const cantidadPendiente = aggregate?.cantidadPendiente ?? 0;
        const cantidadSolicitada = Number(lineaDto.cantidad);

        if (cantidadSolicitada > cantidadPendiente) {
          throw new BadRequestException(
            I18nHelper.getError('DISTRIBUCION_INSUFFICIENT_STOCK_IN_LOCATION', {
              ubicacion: pedidoUsuarioLinea.id,
              producto: String(cantidadPendiente),
            })
          );
        }

        return manager.create(DistribucionLinea, {
          pedidoUsuarioLinea,
          productoProveedor: pedidoUsuarioLinea.productoProveedor,
          cantidadPedida: Number(pedidoUsuarioLinea.cantidad),
          cantidadRecepcionadaAtribuida: aggregate?.cantidadRecepcionada ?? 0,
          cantidadYaDistribuida: aggregate?.cantidadDistribuida ?? 0,
          cantidadADistribuir: cantidadSolicitada,
          cantidadEntregada: 0,
          estado: EstadoDistribucionLinea.PENDIENTE,
          observaciones: lineaDto.observaciones,
          modifiedBy: userId,
        });
      });

      const saved = await manager.save(distribucion);
      return manager.findOneOrFail(Distribucion, {
        where: { id: saved.id },
        relations: [
          'pedidoUsuario',
          'pedidoUsuario.usuario',
          'ubicacionOrigen',
          'ubicacionDestino',
          'alumnoSlot',
          'alumnoSlot.ubicacion',
          'lineas',
          'lineas.productoProveedor',
          'lineas.productoProveedor.producto',
        ],
      });
    });
  }

  /**
   * Confirms a PREPARADA or BORRADOR distribution inside a transaction.
   * Transfers stock from origin to destination for each line using FEFO order,
   * records SALIDA_DISTRIBUCION and ENTRADA_DISTRIBUCION movements, then marks
   * the distribution as ENTREGADA.
   * @param {string} id - UUID of the distribution to confirm.
   * @param {string} userId - ID of the authenticated user confirming the distribution.
   * @returns {Promise<Distribucion>} The confirmed Distribucion with updated estado and fechaEntrega.
   * @throws {NotFoundException} If no distribution with the given ID exists.
   * @throws {BadRequestException} If the distribution is not in PREPARADA or BORRADOR state.
   * @throws {BadRequestException} If any line has insufficient stock at the origin location.
   */
  async confirmar(id: string, userId: string): Promise<Distribucion> {
    return this.dataSource.transaction(async (manager) => {
      const distribucion = await manager.findOne(Distribucion, {
        where: { id },
        relations: [
          'pedidoUsuario',
          'pedidoUsuario.usuario',
          'ubicacionOrigen',
          'ubicacionDestino',
          'lineas',
          'lineas.productoProveedor',
          'lineas.productoProveedor.producto',
        ],
      });

      if (!distribucion) {
        throw new NotFoundException(
          I18nHelper.getError('DISTRIBUCION_NOT_FOUND')
        );
      }

      if (
        distribucion.estado !== EstadoDistribucion.PREPARADA &&
        distribucion.estado !== EstadoDistribucion.BORRADOR
      ) {
        throw new BadRequestException(
          I18nHelper.getError('DISTRIBUCION_ONLY_PREPARADAS_CONFIRMABLE')
        );
      }

      for (const linea of distribucion.lineas || []) {
        await this.transferirLinea(manager, distribucion, linea, userId);
      }

      distribucion.estado = EstadoDistribucion.ENTREGADA;
      distribucion.fechaEntrega = new Date();
      distribucion.modifiedBy = userId;
      await manager.save(distribucion);

      return manager.findOneOrFail(Distribucion, {
        where: { id: distribucion.id },
        relations: [
          'pedidoUsuario',
          'pedidoUsuario.usuario',
          'ubicacionOrigen',
          'ubicacionDestino',
          'alumnoSlot',
          'alumnoSlot.ubicacion',
          'lineas',
          'lineas.productoProveedor',
          'lineas.productoProveedor.producto',
        ],
      });
    });
  }

  /**
   * Cancels a distribution that has not yet been confirmed (delivered).
   * Sets all lines to CANCELADA and records the cancellation reason.
   * @param {string} id - UUID of the distribution to cancel.
   * @param {CancelDistribucionDto} dto - DTO containing the cancellation reason.
   * @param {string} [userId] - Optional ID of the user performing the cancellation.
   * @returns {Promise<Distribucion>} The cancelled Distribucion with updated state.
   * @throws {NotFoundException} If no distribution with the given ID exists.
   * @throws {BadRequestException} If the distribution is already ENTREGADA or PARCIAL.
   */
  async cancelar(
    id: string,
    dto: CancelDistribucionDto,
    userId?: string
  ): Promise<Distribucion> {
    const distribucion = await this.distribucionRepository.findOne({
      where: { id },
      relations: ['lineas'],
    });

    if (!distribucion) {
      throw new NotFoundException(
        I18nHelper.getError('DISTRIBUCION_NOT_FOUND')
      );
    }

    if (
      distribucion.estado === EstadoDistribucion.ENTREGADA ||
      distribucion.estado === EstadoDistribucion.PARCIAL
    ) {
      throw new BadRequestException(
        I18nHelper.getError('DISTRIBUCION_ALREADY_CONFIRMED')
      );
    }

    distribucion.estado = EstadoDistribucion.CANCELADA;
    distribucion.motivoCancelacion = dto.motivoCancelacion;
    if (userId) {
      distribucion.modifiedBy = userId;
    }
    distribucion.lineas?.forEach((linea) => {
      linea.estado = EstadoDistribucionLinea.CANCELADA;
      if (userId) {
        linea.modifiedBy = userId;
      }
    });

    await this.distribucionRepository.save(distribucion);
    return this.findOne(distribucion.id);
  }

  /**
   * Resolves the origin location for a distribution.
   * If an explicit `ubicacionOrigenId` is provided, it is validated and returned.
   * Otherwise defaults to the "Almacén Principal" location, creating it if absent.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {string} [ubicacionOrigenId] - Optional UUID of the requested origin location.
   * @returns {Promise<Ubicacion>} The resolved origin Ubicacion entity.
   * @throws {NotFoundException} If the requested origin location does not exist.
   */
  private async resolveOrigen(
    manager: EntityManager,
    ubicacionOrigenId?: string
  ): Promise<Ubicacion> {
    if (ubicacionOrigenId) {
      const origen = await manager.findOne(Ubicacion, {
        where: { id: ubicacionOrigenId },
      });
      if (!origen) {
        throw new NotFoundException(
          I18nHelper.getError('DISTRIBUCION_ORIGIN_NOT_FOUND')
        );
      }
      return origen;
    }

    let defaultUbicacion = await manager.findOne(Ubicacion, {
      where: { nombre: 'Almacén Principal' },
    });

    if (!defaultUbicacion) {
      defaultUbicacion = manager.create(Ubicacion, {
        nombre: 'Almacén Principal',
        descripcion: 'Ubicación por defecto del economato',
      });
      defaultUbicacion = await manager.save(defaultUbicacion);
    }

    return defaultUbicacion;
  }

  /**
   * Resolves the target AlumnoSlot for a distribution.
   * Prefers the explicitly requested slot; falls back to the student slot linked
   * to the pedidoUsuario's user. Returns `null` if no slot can be determined.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {CreateDistribucionDto} dto - The distribution creation DTO.
   * @param {PedidoUsuario} pedidoUsuario - The loaded user order with user and alumno relations.
   * @returns {Promise<AlumnoSlot | null>} The resolved AlumnoSlot or `null`.
   */
  private async resolveTargetSlot(
    manager: EntityManager,
    dto: CreateDistribucionDto,
    pedidoUsuario: PedidoUsuario
  ): Promise<AlumnoSlot | null> {
    const fallbackSlotId = pedidoUsuario.usuario?.alumno?.slot?.id;
    const requestedSlotId = dto.alumnoSlotId;
    const targetSlotId = requestedSlotId ?? fallbackSlotId;

    if (!targetSlotId) return null;

    const requestedSlot = await manager.findOne(AlumnoSlot, {
      where: { id: targetSlotId },
      relations: ['ubicacion'],
    });

    if (requestedSlot) {
      return requestedSlot;
    }

    if (
      requestedSlotId &&
      fallbackSlotId &&
      fallbackSlotId !== requestedSlotId
    ) {
      const fallbackSlot = await manager.findOne(AlumnoSlot, {
        where: { id: fallbackSlotId },
        relations: ['ubicacion'],
      });

      if (fallbackSlot) {
        return fallbackSlot;
      }
    }

    return null;
  }

  /**
   * Resolves the destination Ubicacion for a distribution.
   * Prefers the explicitly requested destination; falls back to the slot's linked
   * location. Throws if neither source yields a valid location.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {CreateDistribucionDto} dto - The distribution creation DTO.
   * @param {AlumnoSlot | null} targetSlot - The resolved target slot (may be `null`).
   * @returns {Promise<Ubicacion>} The resolved destination Ubicacion entity.
   * @throws {BadRequestException} If no destination ID can be determined.
   * @throws {NotFoundException} If the destination location does not exist in the database.
   */
  private async resolveDestino(
    manager: EntityManager,
    dto: CreateDistribucionDto,
    targetSlot: AlumnoSlot | null
  ): Promise<Ubicacion> {
    const requestedDestinoId = dto.ubicacionDestinoId;
    const slotDestinoId = targetSlot?.ubicacionId;
    const destinoId = requestedDestinoId ?? slotDestinoId;

    if (!destinoId) {
      throw new BadRequestException(
        I18nHelper.getError('DISTRIBUCION_DEST_NO_LOCATION')
      );
    }

    const requestedDestino = await manager.findOne(Ubicacion, {
      where: { id: destinoId },
    });

    if (requestedDestino) {
      return requestedDestino;
    }

    if (requestedDestinoId && slotDestinoId && slotDestinoId !== destinoId) {
      const slotDestino = await manager.findOne(Ubicacion, {
        where: { id: slotDestinoId },
      });

      if (slotDestino) {
        return slotDestino;
      }
    }

    throw new NotFoundException(
      I18nHelper.getError('DISTRIBUCION_DEST_NOT_FOUND')
    );
  }

  /**
   * Computes pending distribution quantities for a set of pedidoUsuario line IDs.
   * Combines recepcionado (received) and distribuido (already distributed) amounts
   * to derive the `cantidadPendiente` for each line.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {string[]} pedidoUsuarioLineaIds - Array of pedidoUsuario line UUIDs to evaluate.
   * @returns {Promise<Map<string, { cantidadRecepcionada: number; cantidadDistribuida: number; cantidadPendiente: number }>>}
   *   A map keyed by pedidoUsuarioLineaId with aggregated quantity data.
   */
  private async calculatePendingByPedidoUsuarioLinea(
    manager: EntityManager,
    pedidoUsuarioLineaIds: string[]
  ): Promise<
    Map<
      string,
      {
        cantidadRecepcionada: number;
        cantidadDistribuida: number;
        cantidadPendiente: number;
      }
    >
  > {
    const recepcionado = await this.getRecepcionadoPorPedidoUsuarioLinea(
      manager,
      pedidoUsuarioLineaIds
    );
    const distribuido = await this.getDistribuidoPorPedidoUsuarioLinea(
      manager,
      pedidoUsuarioLineaIds
    );

    const result = new Map<
      string,
      {
        cantidadRecepcionada: number;
        cantidadDistribuida: number;
        cantidadPendiente: number;
      }
    >();

    for (const pedidoUsuarioLineaId of pedidoUsuarioLineaIds) {
      const cantidadRecepcionada = recepcionado.get(pedidoUsuarioLineaId) ?? 0;
      const cantidadDistribuida = distribuido.get(pedidoUsuarioLineaId) ?? 0;

      result.set(pedidoUsuarioLineaId, {
        cantidadRecepcionada,
        cantidadDistribuida,
        cantidadPendiente: Math.max(
          0,
          Number((cantidadRecepcionada - cantidadDistribuida).toFixed(3))
        ),
      });
    }

    return result;
  }

  /**
   * Aggregates received quantities per pedidoUsuario line, excluding receipt lines
   * whose product state does not count as received (e.g. ROTO).
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {string[]} pedidoUsuarioLineaIds - Line IDs to query.
   * @returns {Promise<Map<string, number>>} Map of pedidoUsuarioLineaId → total received quantity.
   */
  private async getRecepcionadoPorPedidoUsuarioLinea(
    manager: EntityManager,
    pedidoUsuarioLineaIds: string[]
  ): Promise<Map<string, number>> {
    if (pedidoUsuarioLineaIds.length === 0) return new Map();

    const recepciones = await manager
      .getRepository(RecepcionProducto)
      .createQueryBuilder('recepcionProducto')
      .leftJoinAndSelect('recepcionProducto.pedidoProducto', 'pedidoProducto')
      .where('pedidoProducto.pedidoUsuarioLineaId IN (:...ids)', {
        ids: pedidoUsuarioLineaIds,
      })
      .getMany();

    const result = new Map<string, number>();
    for (const recepcion of recepciones) {
      if (!permiteComputarComoRecibido(recepcion.estadoProducto)) {
        continue;
      }

      const pedidoUsuarioLineaId =
        recepcion.pedidoProducto?.pedidoUsuarioLineaId;
      if (!pedidoUsuarioLineaId) continue;

      const current = result.get(pedidoUsuarioLineaId) ?? 0;
      result.set(
        pedidoUsuarioLineaId,
        Number((current + Number(recepcion.cantidadRecibida)).toFixed(3))
      );
    }

    return result;
  }

  /**
   * Aggregates already-distributed quantities per pedidoUsuario line.
   * For ENTREGADA/PARCIAL distributions the `cantidadEntregada` is used;
   * for BORRADOR/PREPARADA the `cantidadADistribuir` is used (reserved).
   * Cancelled distributions are excluded.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {string[]} pedidoUsuarioLineaIds - Line IDs to query.
   * @returns {Promise<Map<string, number>>} Map of pedidoUsuarioLineaId → total distributed quantity.
   */
  private async getDistribuidoPorPedidoUsuarioLinea(
    manager: EntityManager,
    pedidoUsuarioLineaIds: string[]
  ): Promise<Map<string, number>> {
    if (pedidoUsuarioLineaIds.length === 0) return new Map();

    const lineas = await manager
      .getRepository(DistribucionLinea)
      .createQueryBuilder('linea')
      .leftJoinAndSelect('linea.distribucion', 'distribucion')
      .where('linea.pedidoUsuarioLineaId IN (:...ids)', {
        ids: pedidoUsuarioLineaIds,
      })
      .andWhere('distribucion.estado IN (:...estados)', {
        estados: [
          EstadoDistribucion.BORRADOR,
          EstadoDistribucion.PREPARADA,
          EstadoDistribucion.PARCIAL,
          EstadoDistribucion.ENTREGADA,
        ],
      })
      .getMany();

    const result = new Map<string, number>();
    for (const linea of lineas) {
      const current = result.get(linea.pedidoUsuarioLineaId) ?? 0;
      const aSumar =
        linea.distribucion.estado === EstadoDistribucion.ENTREGADA ||
        linea.distribucion.estado === EstadoDistribucion.PARCIAL
          ? Number(linea.cantidadEntregada)
          : Number(linea.cantidadADistribuir);

      result.set(
        linea.pedidoUsuarioLineaId,
        Number((current + aSumar).toFixed(3))
      );
    }

    return result;
  }

  /**
   * Builds a `DistribucionDisponibleDto` for a given pedidoUsuario by computing
   * pending quantities for each line and enriching with slot/location suggestions.
   * Lines with zero pending quantity are filtered out.
   * @param {PedidoUsuario} pedidoUsuario - A loaded PedidoUsuario with all required relations.
   * @returns {Promise<DistribucionDisponibleDto>} The distributable summary DTO.
   */
  private async buildDistribucionDisponible(
    pedidoUsuario: PedidoUsuario
  ): Promise<DistribucionDisponibleDto> {
    const targetSlot = this.resolvePedidoUsuarioSlot(pedidoUsuario);
    const ubicacionesUsuario =
      this.resolvePedidoUsuarioUbicaciones(pedidoUsuario);
    const lineIds = (pedidoUsuario.lineas || []).map((linea) => linea.id);
    const aggregate = await this.calculatePendingByPedidoUsuarioLinea(
      this.dataSource.manager,
      lineIds
    );

    const lineas: DistribucionDisponibleLineaDto[] = (
      pedidoUsuario.lineas || []
    )
      .map((linea) => {
        const summary = aggregate.get(linea.id);
        const cantidadRecepcionada = summary?.cantidadRecepcionada ?? 0;
        const cantidadDistribuida = summary?.cantidadDistribuida ?? 0;
        const cantidadPendiente = summary?.cantidadPendiente ?? 0;

        return {
          pedidoUsuarioLineaId: linea.id,
          productoProveedorId: linea.productoProveedorId,
          productoNombre:
            linea.productoProveedor?.producto?.nombre || 'Producto sin nombre',
          cantidadPedida: Number(linea.cantidad),
          cantidadRecepcionada,
          cantidadDistribuida,
          cantidadPendiente,
        };
      })
      .filter((linea) => linea.cantidadPendiente > 0);

    let sugerida = pedidoUsuario.ubicacionEntregaSugerida
      ? {
          id: pedidoUsuario.ubicacionEntregaSugerida.id,
          nombre: pedidoUsuario.ubicacionEntregaSugerida.nombre,
        }
      : null;

    if (!sugerida && targetSlot?.ubicacion) {
      sugerida = {
        id: targetSlot.ubicacion.id,
        nombre: targetSlot.ubicacion.nombre,
      };
    }

    return {
      pedidoUsuarioId: pedidoUsuario.id,
      numeroGlobal: pedidoUsuario.numeroGlobal,
      estado: pedidoUsuario.estado,
      usuario: pedidoUsuario.usuario
        ? {
            id: pedidoUsuario.usuario.id,
            nombre: pedidoUsuario.usuario.nombre ?? undefined,
            username: pedidoUsuario.usuario.username ?? undefined,
          }
        : null,
      alumnoSlot: targetSlot
        ? {
            id: targetSlot.id,
            aula: targetSlot.aula,
            numeroClase: targetSlot.numeroClase,
            ubicacionId: targetSlot.ubicacion?.id,
            ubicacionNombre: targetSlot.ubicacion?.nombre,
          }
        : null,
      ubicacionDestinoSugerida: sugerida,
      ubicacionesUsuario,
      lineas,
    };
  }

  /**
   * Derives the list of unique delivery locations associated with a pedidoUsuario.
   * For students, returns the single slot location. For teachers, collects all
   * unique slot locations sorted alphabetically by name.
   * @param {PedidoUsuario} pedidoUsuario - A loaded PedidoUsuario with user/alumno/profesor relations.
   * @returns {Array<{ id: string; nombre: string }>} Array of unique location summaries.
   */
  private resolvePedidoUsuarioUbicaciones(
    pedidoUsuario: PedidoUsuario
  ): Array<{ id: string; nombre: string }> {
    const alumnoSlot = pedidoUsuario.usuario?.alumno?.slot;

    if (alumnoSlot?.ubicacion) {
      return [
        {
          id: alumnoSlot.ubicacion.id,
          nombre: alumnoSlot.ubicacion.nombre,
        },
      ];
    }

    const profesorSlots = pedidoUsuario.usuario?.profesor?.slots ?? [];

    return Array.from(
      new Map(
        profesorSlots
          .filter((slot) => slot.ubicacion?.id && slot.ubicacion?.nombre)
          .map((slot) => [
            slot.ubicacion!.id,
            {
              id: slot.ubicacion!.id,
              nombre: slot.ubicacion!.nombre,
            },
          ])
      ).values()
    ).sort((left, right) =>
      left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' })
    );
  }

  /**
   * Resolves the primary AlumnoSlot for a pedidoUsuario.
   * Returns the student's own slot, or the first professor slot sorted by aula
   * and numeroClase. Returns `null` if no slot is associated.
   * @param {PedidoUsuario} pedidoUsuario - A loaded PedidoUsuario with user/alumno/profesor relations.
   * @returns {AlumnoSlot | null} The primary slot, or `null`.
   */
  private resolvePedidoUsuarioSlot(
    pedidoUsuario: PedidoUsuario
  ): AlumnoSlot | null {
    const alumnoSlot = pedidoUsuario.usuario?.alumno?.slot;

    if (alumnoSlot) {
      return alumnoSlot;
    }

    const profesorSlots = pedidoUsuario.usuario?.profesor?.slots;

    if (!profesorSlots || profesorSlots.length === 0) {
      return null;
    }

    return [...profesorSlots].sort((left, right) => {
      const aulaCompare = left.aula.localeCompare(right.aula, 'es', {
        sensitivity: 'base',
      });

      if (aulaCompare !== 0) {
        return aulaCompare;
      }

      return left.numeroClase - right.numeroClase;
    })[0];
  }

  /**
   * Transfers the stock for a single distribution line from origin to destination
   * using FEFO (First-Expired First-Out) order.
   * For each origin inventory batch consumed:
   * - Decrements the origin inventory.
   * - Finds or creates a matching destination inventory batch (same product + expiry date).
   * - Increments the destination inventory.
   * - Records SALIDA_DISTRIBUCION and ENTRADA_DISTRIBUCION movement entries.
   * Marks the line as ENTREGADA after the full quantity has been transferred.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @param {Distribucion} distribucion - The parent distribution with ubicacionOrigen/Destino loaded.
   * @param {DistribucionLinea} linea - The distribution line to process.
   * @param {string} userId - ID of the user confirming the distribution.
   * @returns {Promise<void>}
   * @throws {BadRequestException} If total stock at origin is insufficient for the requested quantity.
   */
  private async transferirLinea(
    manager: EntityManager,
    distribucion: Distribucion,
    linea: DistribucionLinea,
    userId: string
  ): Promise<void> {
    const cantidadObjetivo = Number(linea.cantidadADistribuir);
    let restante = cantidadObjetivo;

    const inventariosOrigen = await manager.find(Inventario, {
      where: {
        productoProveedorId: linea.productoProveedorId,
        ubicacionId: distribucion.ubicacionOrigenId,
      },
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'ubicacion',
      ],
      order: {
        fechaCaducidad: 'ASC',
        fechaEntrada: 'ASC',
      },
    });

    const stockTotal = inventariosOrigen.reduce(
      (sum, inventario) => sum + Number(inventario.cantidadActual),
      0
    );

    if (stockTotal < cantidadObjetivo) {
      throw new BadRequestException(
        I18nHelper.getError('DISTRIBUCION_INSUFFICIENT_STOCK_IN_LOCATION', {
          ubicacion: distribucion.ubicacionOrigen.nombre,
          producto: linea.productoProveedor.producto?.nombre ?? '',
        })
      );
    }

    for (const inventarioOrigen of inventariosOrigen) {
      if (restante <= 0) break;

      const disponible = Number(inventarioOrigen.cantidadActual);
      if (disponible <= 0) continue;

      const mover = Math.min(disponible, restante);
      inventarioOrigen.ajustarCantidad(-mover);
      inventarioOrigen.modifiedBy = userId;
      await manager.save(inventarioOrigen);

      const inventarioDestinoQb = manager
        .createQueryBuilder(Inventario, 'inventario')
        .leftJoinAndSelect('inventario.productoProveedor', 'productoProveedor')
        .leftJoinAndSelect('inventario.ubicacion', 'ubicacion')
        .where('inventario.productoProveedorId = :productoProveedorId', {
          productoProveedorId: linea.productoProveedorId,
        })
        .andWhere('inventario.ubicacionId = :ubicacionId', {
          ubicacionId: distribucion.ubicacionDestinoId,
        });

      if (inventarioOrigen.fechaCaducidad) {
        inventarioDestinoQb.andWhere(
          'inventario.fechaCaducidad = :fechaCaducidad',
          { fechaCaducidad: inventarioOrigen.fechaCaducidad }
        );
      } else {
        inventarioDestinoQb.andWhere('inventario.fechaCaducidad IS NULL');
      }

      let inventarioDestino = await inventarioDestinoQb.getOne();

      if (!inventarioDestino) {
        inventarioDestino = manager.create(Inventario, {
          productoProveedor: inventarioOrigen.productoProveedor,
          cantidadActual: mover,
          cantidadMinima: 0,
          cantidadMaxima: null,
          ubicacion: distribucion.ubicacionDestino,
          fechaEntrada: new Date(),
          fechaCaducidad: inventarioOrigen.fechaCaducidad ?? null,
          modifiedBy: userId,
        });
      } else {
        inventarioDestino.ajustarCantidad(mover);
        inventarioDestino.modifiedBy = userId;
      }

      inventarioDestino = await manager.save(inventarioDestino);

      const productoNombre =
        inventarioOrigen.productoProveedor?.producto?.nombre ||
        'producto sin nombre';

      await manager.save(
        manager.create(Movimiento, {
          tipo: TipoMovimiento.SALIDA_DISTRIBUCION,
          cantidad: mover,
          inventario: inventarioOrigen,
          productoProveedor: inventarioOrigen.productoProveedor,
          entidad: 'Distribucion',
          entidadId: distribucion.id,
          descripcion: `Distribución a ${distribucion.ubicacionDestino.nombre}: salida de ${productoNombre}`,
          usuario: { id: userId } as any,
          modifiedBy: userId,
        })
      );

      await manager.save(
        manager.create(Movimiento, {
          tipo: TipoMovimiento.ENTRADA_DISTRIBUCION,
          cantidad: mover,
          inventario: inventarioDestino,
          productoProveedor: inventarioOrigen.productoProveedor,
          entidad: 'Distribucion',
          entidadId: distribucion.id,
          descripcion: `Distribución desde ${distribucion.ubicacionOrigen.nombre}: entrada de ${productoNombre}`,
          usuario: { id: userId } as any,
          modifiedBy: userId,
        })
      );

      restante = Number((restante - mover).toFixed(3));
    }

    linea.cantidadEntregada = cantidadObjetivo;
    linea.estado = EstadoDistribucionLinea.ENTREGADA;
    linea.modifiedBy = userId;
    await manager.save(linea);
  }
}
