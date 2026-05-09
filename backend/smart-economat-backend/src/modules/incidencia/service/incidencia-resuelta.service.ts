/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { IncidenciaResuelaRepository } from '../repository/incidencia-resuelta.repository';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { CreateIncidenciaResuelaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaResuelaDto } from '../dto/update-incidencia.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Servicio de dominio para incidencia resuela.
 */
@Injectable()
export class IncidenciaResuelaService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    private readonly incidenciaResuelaRepository: IncidenciaResuelaRepository,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

  /**
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: dto.idIncidencia },
    });

    if (!incidencia) {
      throw new NotFoundException(I18nHelper.getError('INCIDENCIA_NOT_FOUND'));
    }

    const resolucionExistente =
      await this.incidenciaResuelaRepository.findByIncidencia(dto.idIncidencia);

    if (resolucionExistente) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    incidencia.resolver(dto.idUsuarioResolutor, dto.observaciones);
    await this.incidenciaRepository.save(incidencia);

    const resolucion = this.incidenciaResuelaRepository.create({
      incidencia: { id: dto.idIncidencia } as Incidencia,
      usuarioResolutor: { id: dto.idUsuarioResolutor } as any,
      tipoResolucion: dto.tipoResolucion,
      fechaResolucion: new Date(),
      observaciones: dto.observaciones,
    });

    return this.incidenciaResuelaRepository.save(resolucion);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<IncidenciaResuelta>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    return this.incidenciaResuelaRepository.findAllPaginated(query, userRole);
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @param userRole Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string, userRole?: string): Promise<IncidenciaResuelta> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const resolucion = await this.incidenciaResuelaRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: ['incidencia', 'usuarioResolutor'],
    });

    if (!resolucion) {
      throw new NotFoundException(
        I18nHelper.getError('INCIDENCIA_RESUELTA_NOT_FOUND')
      );
    }

    return resolucion;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateIncidenciaResuelaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<IncidenciaResuelta>} Datos efectivos después de ejecutar la operación.
   */
  async update(
    id: string,
    dto: UpdateIncidenciaResuelaDto
  ): Promise<IncidenciaResuelta> {
    const resolucion = await this.findOne(id);

    this.incidenciaResuelaRepository.merge(resolucion, {
      tipoResolucion: dto.tipoResolucion,
      observaciones: dto.observaciones,
      usuarioResolutor: dto.idUsuarioResolutor
        ? ({ id: dto.idUsuarioResolutor } as any)
        : resolucion.usuarioResolutor,
    });

    return this.incidenciaResuelaRepository.save(resolucion);
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const resolucion = await this.findOne(id);

    const incidencia = resolucion.incidencia;
    incidencia.fechaResolucion = null;
    incidencia.usuarioResolutor = undefined;
    incidencia.observacionesResolucion = undefined;
    await this.incidenciaRepository.save(incidencia);

    await this.incidenciaResuelaRepository.softDelete(id);
  }
}
