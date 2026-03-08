import { Repository } from 'typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
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
    };
    return this.repo.save(
      this.repo.create(movimientoData as Partial<Movimiento>)
    );
  }

  findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.repo
      .findAndCount({
        relations: ['usuario', 'productoProveedor', 'inventario'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(
        ([data, total]) =>
          ({
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          }) as PaginatedResponseDto<any>
      );
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['usuario', 'productoProveedor', 'inventario'],
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
    } = dto;

    if (!entityId && !userId) {
      return [];
    }

    const query = this.repo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('movimiento.inventario', 'inventario');

    if (entityId) {
      query.where('movimiento.producto_proveedor_id = :entityId', { entityId });
    }

    if (userId) {
      if (entityId) {
        query.orWhere('movimiento.usuario_id = :userId', { userId });
      } else {
        query.where('movimiento.usuario_id = :userId', { userId });
      }
    }

    if (type) {
      query.andWhere('movimiento.tipo = :type', { type });
    }

    if (startDate) {
      query.andWhere('movimiento.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      query.andWhere('movimiento.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    query.orderBy(`movimiento.${sortBy}`, sortOrder);

    return query.getMany();
  }
}
