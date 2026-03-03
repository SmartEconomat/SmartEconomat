import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { IncidenciaRepository } from '../repository/incidencia.repository';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { ResolverIncidenciaDto } from '../dto/resolver-incidencia.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class IncidenciaService {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async create(dto: CreateIncidenciaDto): Promise<Incidencia> {
    const incidencia = this.incidenciaRepository.create({
      recepcion: { id: dto.recepcionId } as any,
      ...(dto.pedidoId ? { pedido: { id: dto.pedidoId } as any } : {}),
      observacionesRecepcion: dto.observacionesRecepcion,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  async findAll(): Promise<Incidencia[]> {
    return this.incidenciaRepository.findAllWithRelations();
  }

  async findOne(id: string): Promise<Incidencia> {
    const incidencia = await this.incidenciaRepository.findOneWithRelations(id);

    if (!incidencia) {
      throw new NotFoundException(I18nHelper.getError('INCIDENCIA_NOT_FOUND'));
    }

    return incidencia;
  }

  async update(id: string, dto: UpdateIncidenciaDto): Promise<Incidencia> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    this.incidenciaRepository.merge(incidencia, {
      ...(dto.recepcionId ? { recepcion: { id: dto.recepcionId } as any } : {}),
      ...(dto.pedidoId ? { pedido: { id: dto.pedidoId } as any } : {}),
      observacionesRecepcion: dto.observacionesRecepcion,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  async remove(id: string): Promise<void> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    await this.incidenciaRepository.remove(incidencia);
  }

  async resolverIncidencia(
    id: string,
    dto: ResolverIncidenciaDto
  ): Promise<Incidencia> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    incidencia.resolver(dto.usuarioId, dto.observacionesResolucion);

    return this.incidenciaRepository.save(incidencia);
  }
}
