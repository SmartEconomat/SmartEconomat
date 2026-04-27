/**
 * Documentación en español.
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
 * Documentación en español.
 */
@Injectable()
export class DistribucionService {
  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
