import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { IncidenciaQueryDto } from '../dto/incidencia-query.dto';

@Injectable()
export class IncidenciaRepository extends Repository<Incidencia> {
  constructor(private dataSource: DataSource) {
    super(Incidencia, dataSource.createEntityManager());
  }

  findOneWithRelations(id: string): Promise<Incidencia | null> {
    return this.findOne({
      where: { id },
      relations: [
        'recepcion',
        'pedido',
        'usuarioResolutor',
        'lineas',
        'lineas.pedidoProducto',
      ],
    });
  }

  findAllWithRelations(): Promise<Incidencia[]> {
    return this.find({
      relations: ['recepcion', 'pedido', 'usuarioResolutor', 'lineas'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    query: IncidenciaQueryDto
  ): Promise<PaginatedResponseDto<Incidencia>> {
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
      .leftJoinAndSelect('lineas.pedidoProducto', 'pedidoProducto');

    if (query.searchTerm?.trim()) {
      const searchTerm = `%${query.searchTerm.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        `(
          LOWER(COALESCE(proveedor.nombre, '')) LIKE :searchTerm
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
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('incidencia.createdAt <= :endDate', {
        endDate,
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
