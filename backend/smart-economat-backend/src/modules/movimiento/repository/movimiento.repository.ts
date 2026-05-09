import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoListQueryDto } from '../dto/movimiento-list-query.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/** Clase pública (MovimientoRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class MovimientoRepository {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Movimiento>} repo - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectRepository(Movimiento)
    private readonly repo: Repository<Movimiento>
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMovimientoDto} data - Entrada efectiva esperada por el contrato.
   * @undefined {EntityManager | undefined} manager - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  createMovimiento(data: CreateMovimientoDto, manager?: EntityManager) {
    const movimientoData: Record<string, unknown> = {
      tipo: data.tipo ?? TipoMovimiento.AUDITORIA,
      accion: data.accion,
      cantidad: data.cantidad,
      entidad: data.entidadTipo,
      entidadId: data.entidadId,
      descripcion: data.descripcion,
      datosAntes: data.datosAntes,
      datosDespues: data.datosDespues,
      ...(data.usuario ? { usuario: { id: data.usuario } } : {}),
      ...(data.inventario ? { inventario: { id: data.inventario } } : {}),
      ...(data.productoProveedor
        ? { productoProveedor: { id: data.productoProveedor } }
        : {}),
      ...(data.ubicacionOrigen
        ? { ubicacionOrigenId: data.ubicacionOrigen }
        : {}),
      ...(data.ubicacionDestino
        ? { ubicacionDestinoId: data.ubicacionDestino }
        : {}),
      ...(data.transferencia ? { transferenciaId: data.transferencia } : {}),
      ...(data.idempotenciaKey
        ? { idempotenciaKey: data.idempotenciaKey }
        : {}),
    };

    if (manager) {
      return manager.save(
        manager.create(Movimiento, movimientoData as Partial<Movimiento>)
      );
    }

    return this.repo.save(
      this.repo.create(movimientoData as Partial<Movimiento>)
    );
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {MovimientoListQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Movimiento>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(query: MovimientoListQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const qb = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.productoProveedor', 'pp')
      .leftJoinAndSelect('pp.producto', 'prod');

    if (query.type?.length) {
      qb.andWhere('movimiento.tipo IN (:...types)', {
        types: query.type,
      });
    }

    if (query.startDate) {
      qb.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
        endDate.setHours(23, 59, 59, 999);
      }
      qb.andWhere('movimiento.createdAt <= :endDate', {
        endDate,
      });
    }

    if (query.searchTerm) {
      const searchTerm = `%${query.searchTerm.trim()}%`;
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where('movimiento.descripcion ILIKE :searchTerm', { searchTerm })
            .orWhere('movimiento.entidad ILIKE :searchTerm', { searchTerm })
            .orWhere('usuario.nombre ILIKE :searchTerm', { searchTerm })
            .orWhere('prod.nombre ILIKE :searchTerm', { searchTerm });
        })
      );
    }

    let totalPromise: Promise<number>;
    if (!query.searchTerm) {
      const simpleCountQb = this.repo.createQueryBuilder('movimiento');
      if (query.type?.length) {
        simpleCountQb.andWhere('movimiento.tipo IN (:...types)', {
          types: query.type,
        });
      }
      if (query.startDate) {
        simpleCountQb.andWhere('movimiento.createdAt >= :startDate', {
          startDate: new Date(query.startDate),
        });
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
          endDate.setHours(23, 59, 59, 999);
        }
        simpleCountQb.andWhere('movimiento.createdAt <= :endDate', {
          endDate,
        });
      }
      totalPromise = simpleCountQb.getCount();
    } else {
      totalPromise = qb.clone().getCount();
    }

    const [data, total] = await Promise.all([
      qb
        .orderBy(`movimiento.${sortBy}`, order)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      totalPromise,
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    } as PaginatedResponseDto<Movimiento>;
  }

  /**
   * Expone "findById" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Movimiento | null>} Datos efectivos después de ejecutar la operación.
   */
  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        'usuario',
        'productoProveedor',
        'productoProveedor.producto',
        'inventario',
        'inventario.productoProveedor',
        'inventario.productoProveedor.producto',
      ],
    });
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateMovimientoDto} data - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/typeorm/index").UpdateResult>} Datos efectivos después de ejecutar la operación.
   */
  updateMovimiento(id: string, data: UpdateMovimientoDto) {
    const updateData: QueryDeepPartialEntity<Movimiento> = {
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.usuario !== undefined &&
        data.usuario !== null &&
        `${data.usuario}`.trim() !== '' && { usuarioId: data.usuario }),
    };
    return this.repo.update(id, updateData);
  }

  /**
   * Elimina o marca entidades siguendo las políticas configuradas.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/typeorm/index").UpdateResult>} Datos efectivos después de ejecutar la operación.
   */
  deleteMovimiento(id: string) {
    return this.repo.softDelete(id);
  }

  /**
   * Expone "findMovimientosByEntity" en smart-economat-backend (Nest).
   * @undefined {MovimientoHistoryDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Movimiento>>} Datos efectivos después de ejecutar la operación.
   */
  async findMovimientosByEntity(dto: MovimientoHistoryDto) {
    const {
      entityId,
      userId,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order,
      sortOrder,
      page = 1,
      limit = 20,
    } = dto;
    const resolvedOrder = order ?? sortOrder ?? 'DESC';

    if (!entityId && !userId) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      } as PaginatedResponseDto<Movimiento>;
    }

    const qb = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.productoProveedor', 'pp')
      .leftJoinAndSelect('pp.producto', 'prod');

    if (entityId) {
      qb.andWhere('movimiento.productoProveedorId = :entityId', { entityId });
    }

    if (userId) {
      qb.andWhere('movimiento.usuarioId = :userId', { userId });
    }

    if (type) {
      qb.andWhere('movimiento.tipo = :type', { type });
    }

    if (startDate) {
      qb.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      qb.andWhere('movimiento.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const countQb = this.repo.createQueryBuilder('movimiento');
    if (entityId) {
      countQb.andWhere('movimiento.productoProveedorId = :entityId', {
        entityId,
      });
    }
    if (userId) {
      countQb.andWhere('movimiento.usuarioId = :userId', { userId });
    }
    if (type) {
      countQb.andWhere('movimiento.tipo = :type', { type });
    }
    if (startDate) {
      countQb.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      countQb.andWhere('movimiento.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const [data, total] = await Promise.all([
      qb
        .orderBy(`movimiento.${sortBy}`, resolvedOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      countQb.getCount(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
