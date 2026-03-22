import { Brackets, Repository } from 'typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { MovimientoListQueryDto } from '../dto/movimiento-list-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class MovimientoRepository {
  constructor(
    @InjectRepository(Movimiento)
    private readonly repo: Repository<Movimiento>
  ) {}

  createMovimiento(data: CreateMovimientoDto) {
    const movimientoData: Record<string, unknown> = {
      tipo: data.tipo,
      cantidad: data.cantidad,
      entidad: data.entidadTipo,
      entidadId: data.entidadId,
      descripcion: data.descripcion,
      ...(data.usuario ? { usuario: { id: data.usuario } } : {}),
      ...(data.inventario ? { inventario: { id: data.inventario } } : {}),
      ...(data.productoProveedor
        ? { productoProveedor: { id: data.productoProveedor } }
        : {}),
    };
    return this.repo.save(
      this.repo.create(movimientoData as Partial<Movimiento>)
    );
  }

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
        if (/^\d{4}-\d{2}-\d{2}$/.test(query.endDate))
          endDate.setHours(23, 59, 59, 999);
        simpleCountQb.andWhere('movimiento.createdAt <= :endDate', { endDate });
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
    } as PaginatedResponseDto<any>;
  }

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

  updateMovimiento(id: string, data: UpdateMovimientoDto) {
    const updateData: Partial<Movimiento> = {
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.usuario && { usuario: { id: data.usuario } as any }),
    };
    return this.repo.update(id, updateData);
  }

  deleteMovimiento(id: string) {
    return this.repo.softDelete(id);
  }

  /**
   * Busca movimientos de un producto o usuario específico con filtros opcionales.
   *
   * @param dto - DTO con entityId (ProductoProveedor), userId, tipo, rango de fechas
   * @returns Array de movimientos ordenados cronológicamente (DESC)
   */
  async findMovimientosByEntity(dto: MovimientoHistoryDto) {
    const {
      entityId,
      userId,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = dto;

    if (!entityId && !userId) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      } as any;
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
    if (entityId)
      countQb.andWhere('movimiento.productoProveedorId = :entityId', {
        entityId,
      });
    if (userId) countQb.andWhere('movimiento.usuarioId = :userId', { userId });
    if (type) countQb.andWhere('movimiento.tipo = :type', { type });
    if (startDate)
      countQb.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      countQb.andWhere('movimiento.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });

    const [data, total] = await Promise.all([
      qb
        .orderBy(`movimiento.${sortBy}`, sortOrder)
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
