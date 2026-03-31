import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class IncidenciaResuelaRepository extends Repository<IncidenciaResuelta> {
  constructor(private dataSource: DataSource) {
    super(IncidenciaResuelta, dataSource.createEntityManager());
  }

  findByIncidencia(
    idIncidencia: string,
    userRole?: string
  ): Promise<IncidenciaResuelta | null> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    return this.findOne({
      where: { incidencia: { id: idIncidencia } },
      withDeleted: isAdmin,
      relations: ['incidencia', 'usuarioResolutor'],
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fechaResolucion';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.findAndCount({
      relations: ['incidencia', 'usuarioResolutor'],
      withDeleted: isAdmin,
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
