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

@Injectable()
export class IncidenciaResuelaService {
  constructor(
    private readonly incidenciaResuelaRepository: IncidenciaResuelaRepository,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

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

    incidencia.resolver(dto.idUsuarioResolutor ?? '', dto.observaciones);
    await this.incidenciaRepository.save(incidencia);

    const resolucion = this.incidenciaResuelaRepository.create({
      incidencia: { id: dto.idIncidencia } as Incidencia,
      usuarioResolutor: dto.idUsuarioResolutor
        ? ({ id: dto.idUsuarioResolutor } as any)
        : null,
      tipoResolucion: dto.tipoResolucion,
      fechaResolucion: new Date(),
      observaciones: dto.observaciones,
    });

    return this.incidenciaResuelaRepository.save(resolucion);
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    return this.incidenciaResuelaRepository.findAllPaginated(query);
  }

  async findOne(id: string): Promise<IncidenciaResuelta> {
    const resolucion = await this.incidenciaResuelaRepository.findOne({
      where: { id },
      relations: ['incidencia', 'usuarioResolutor'],
    });

    if (!resolucion) {
      throw new NotFoundException(
        I18nHelper.getError('INCIDENCIA_RESUELTA_NOT_FOUND')
      );
    }

    return resolucion;
  }

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

  async remove(id: string): Promise<void> {
    const resolucion = await this.findOne(id);

    const incidencia = resolucion.incidencia;
    incidencia.fechaResolucion = null;
    incidencia.usuarioResolutor = undefined;
    incidencia.observacionesResolucion = undefined;
    await this.incidenciaRepository.save(incidencia);

    await this.incidenciaResuelaRepository.remove(resolucion);
  }
}
