import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

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
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Incidencia>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.findAndCount({
      relations: ['recepcion', 'pedido', 'usuarioResolutor', 'lineas'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
