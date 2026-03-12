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
import { DataSource, Repository } from 'typeorm';
import { ReportIncidenciaDto } from '../dto/report-incidencia.dto';
import { ResolveIncidenciaDto } from '../dto/resolve-incidencia.dto';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { TipoResolucion } from '../enums/incidencia.enums';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { IncidenciaResuelaRepository } from '../repository/incidencia-resuelta.repository';

@Injectable()
export class IncidenciaService {
  constructor(
    private readonly incidenciaRepository: IncidenciaRepository,
    private readonly incidenciaResueltaRepository: IncidenciaResuelaRepository,
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,
    private readonly dataSource: DataSource,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

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

  async reportarIncidencia(dto: ReportIncidenciaDto): Promise<Incidencia> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id: dto.recepcionId },
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    // Marcar recepción con incidencia
    recepcion.incidencia = true;
    await this.recepcionRepository.save(recepcion);

    const incidencia = this.incidenciaRepository.create({
      recepcion: { id: dto.recepcionId } as any,
      observacionesRecepcion: `Incidencia reportada de tipo: ${dto.tipo}`,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  async resolverIncidenciaTransaccional(
    id: string,
    dto: ResolveIncidenciaDto,
    usuarioId: string
  ): Promise<Incidencia> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Crear registro en IncidenciaResuelta
      const resolucion = manager.create(IncidenciaResuelta, {
        incidenciaId: incidencia.id,
        usuarioResolutorId: usuarioId,
        tipoResolucion: dto.accion,
        fechaResolucion: new Date(),
        observaciones: dto.observaciones,
      });

      await manager.save(resolucion);

      // 2. Si la resolución implica devolver stock, generar Movimiento de ajuste
      if (dto.accion === TipoResolucion.DEVOLUCION) {
        // En un flujo real, necesitaríamos saber qué productos y cantidades ajustar.
        // Para este requerimiento de "cambios mínimos", generamos un movimiento general
        // asociado a la recepción o dejamos la puerta abierta para extenderlo.
        await this.movimientoHelper.createMovimiento(
          usuarioId,
          TipoMovimiento.SALIDA_AJUSTE,
          'Incidencia',
          incidencia.id,
          0, // Cantidad debería venir de las líneas de incidencia en una implementación completa
          undefined,
          undefined,
          `Ajuste por resolución de incidencia (${dto.accion}): ${dto.observaciones || ''}`
        );
      }

      // 3. Actualizar Incidencia original
      incidencia.resolver(usuarioId, dto.observaciones);
      return await manager.save(incidencia);
    });
  }
}
