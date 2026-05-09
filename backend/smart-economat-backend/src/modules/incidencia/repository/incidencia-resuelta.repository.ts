import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (IncidenciaResuelaRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class IncidenciaResuelaRepository extends Repository<IncidenciaResuelta> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(IncidenciaResuelta, dataSource.createEntityManager());
  }

  /**
   * Expone "findByIncidencia" en smart-economat-backend (Nest).
   * @undefined {string} idIncidencia - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<IncidenciaResuelta | null>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Expone "findAllPaginated" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<IncidenciaResuelta>>} Datos efectivos después de ejecutar la operación.
   */
  async findAllPaginated(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const requestedSort = query.sortBy ?? 'fechaResolucion';
    const sortBy = SORTABLE_FIELDS.incidenciasResueltas.includes(requestedSort)
      ? requestedSort
      : 'fechaResolucion';
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
