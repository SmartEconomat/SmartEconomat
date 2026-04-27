import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { IncidenciaQueryDto } from '../dto/incidencia-query.dto';

/**
 * Documentación en español.
 */
function normalizeDateBoundary(
  value: string,
  boundary: 'start' | 'end'
): string {
  if (value.length !== 10) {
    return value;
  }

  return boundary === 'start'
    ? `${value}T00:00:00.000Z`
    : `${value}T23:59:59.999Z`;
}

@Injectable()
/**
 * Documentación en español.
 */
export class IncidenciaRepository extends Repository<Incidencia> {
  constructor(private dataSource: DataSource) {
    super(Incidencia, dataSource.createEntityManager());
  }

  /**
   * Documentación en español.
   */
  findOneWithRelations(
    id: string,
    userRole?: string
  ): Promise<Incidencia | null> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    return this.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: [
        'recepcion',
        'pedido',
        'pedido.proveedor',
        'usuarioResolutor',
        'lineas',
        'lineas.pedidoProducto',
        'lineas.pedidoProducto.productoProveedor',
        'lineas.pedidoProducto.productoProveedor.producto',
        'lineas.pedidoProducto.productoProveedor.proveedor',
      ],
    });
  }

  /**
   * Documentación en español.
   */
  findAllWithRelations(): Promise<Incidencia[]> {
    return this.find({
      relations: [
        'recepcion',
        'pedido',
        'pedido.proveedor',
        'usuarioResolutor',
        'lineas',
        'lineas.pedidoProducto',
        'lineas.pedidoProducto.productoProveedor',
        'lineas.pedidoProducto.productoProveedor.producto',
        'lineas.pedidoProducto.productoProveedor.proveedor',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Documentación en español.
   */
  async findAllPaginated(
    query: IncidenciaQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Incidencia>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const queryBuilder = this.createQueryBuilder('incidencia')
      .leftJoinAndSelect('incidencia.recepcion', 'recepcion')
      .leftJoinAndSelect('incidencia.pedido', 'pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('incidencia.usuarioResolutor', 'usuarioResolutor')
      .leftJoinAndSelect('incidencia.lineas', 'lineas')
      .leftJoinAndSelect('lineas.pedidoProducto', 'pedidoProducto')
      .leftJoinAndSelect(
        'pedidoProducto.productoProveedor',
        'productoProveedor'
      )
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .leftJoinAndSelect(
        'productoProveedor.proveedor',
        'proveedorProductoProveedor'
      );

    if (isAdmin) {
      queryBuilder.withDeleted();
    }

    if (query.searchTerm?.trim()) {
      const searchTerm = `%${query.searchTerm.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        `(
          LOWER(COALESCE(proveedor.nombre, '')) LIKE :searchTerm
          OR LOWER(COALESCE(producto.nombre, '')) LIKE :searchTerm
          OR LOWER(COALESCE(incidencia.observacionesRecepcion, '')) LIKE :searchTerm
          OR LOWER(COALESCE(incidencia.observacionesResolucion, '')) LIKE :searchTerm
        )`,
        { searchTerm }
      );
    }

    if (typeof query.resuelta === 'boolean') {
      if (query.resuelta) {
        queryBuilder.andWhere('incidencia.fechaResolucion IS NOT NULL');
      } else {
        queryBuilder.andWhere('incidencia.fechaResolucion IS NULL');
      }
    }

    if (query.startDate) {
      queryBuilder.andWhere('incidencia.createdAt >= :startDate', {
        startDate: normalizeDateBoundary(query.startDate, 'start'),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('incidencia.createdAt <= :endDate', {
        endDate: normalizeDateBoundary(query.endDate, 'end'),
      });
    }

    const allowedSortFields = new Set([
      'recepcionId',
      'pedidoId',
      'fechaResolucion',
      'createdAt',
      'updatedAt',
    ]);
    const normalizedSortBy = allowedSortFields.has(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await queryBuilder
      .orderBy(`incidencia.${normalizedSortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
