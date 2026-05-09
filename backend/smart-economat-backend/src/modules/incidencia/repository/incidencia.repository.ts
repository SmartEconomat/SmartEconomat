import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { IncidenciaQueryDto } from '../dto/incidencia-query.dto';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

/** Clase pública (IncidenciaRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
/**
 * Repositorio para operaciones de persistencia de incidencia.
 */
export class IncidenciaRepository extends Repository<Incidencia> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(Incidencia, dataSource.createEntityManager());
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOneWithRelations" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia | null>} Datos efectivos después de ejecutar la operación.
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
   * Busca all with relations.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findAllWithRelations" en smart-economat-backend (Nest).
   * @undefined {Promise<Incidencia[]>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAllPaginated" en smart-economat-backend (Nest).
   * @undefined {IncidenciaQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Incidencia>>} Datos efectivos después de ejecutar la operación.
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

    queryBuilder
      .andWhere('incidencia.fechaResolucion IS NULL')
      .andWhere('lineas.id IS NOT NULL');

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
