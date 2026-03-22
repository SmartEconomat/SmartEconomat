import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PreparacionRepository } from '../repository/preparacion.repository';
import { ProduccionService } from '../../receta/service/produccion.service';
import { RecetaRepository } from '../../receta/repository/receta.repository';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { PreparacionEstado } from '../enums/preparacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Preparacion } from '../preparacion.entity/preparacion.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class PreparacionService {
  constructor(
    private readonly preparacionRepository: PreparacionRepository,
    private readonly produccionService: ProduccionService,
    private readonly recetaRepository: RecetaRepository
  ) {}

  async create(
    dto: CreatePreparacionDto,
    userId: string
  ): Promise<Preparacion> {
    const receta = await this.recetaRepository.findById(dto.recetaId);
    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return this.preparacionRepository.create(dto, userId);
  }

  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Preparacion>> {
    return this.preparacionRepository.findAllPaginated(query, userRole);
  }

  async findOne(id: string, userRole?: string): Promise<Preparacion> {
    const preparacion = await this.preparacionRepository.findById(id, userRole);
    if (!preparacion) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
    return preparacion;
  }

  async iniciarPreparacion(id: string): Promise<Preparacion> {
    const preparacion = await this.findOne(id);
    if (preparacion.estado !== PreparacionEstado.PENDIENTE) {
      throw new ConflictException(
        `No se puede iniciar una preparación en estado ${preparacion.estado}`
      );
    }

    preparacion.estado = PreparacionEstado.EN_PROCESO;
    preparacion.fechaInicio = new Date();
    return this.preparacionRepository.save(preparacion);
  }

  async finalizarPreparacion(
    id: string,
    userId: string,
    ubicacionDestinoId?: string
  ): Promise<Preparacion> {
    const preparacion = await this.findOne(id);

    if (preparacion.estado !== PreparacionEstado.EN_PROCESO) {
      throw new ConflictException(
        `Solo se pueden finalizar preparaciones EN_PROCESO. Estado actual: ${preparacion.estado}`
      );
    }

    const destinoId = ubicacionDestinoId || preparacion.ubicacionDestinoId;
    if (!destinoId) {
      throw new BadRequestException(
        'Se requiere una ubicación de destino para finalizar la preparación'
      );
    }

    await this.produccionService.ejecutarProduccion(
      {
        recetaId: preparacion.recetaId,
        cantidadProducida: preparacion.cantidadAProducir,
        ubicacionDestinoId: destinoId,
      },
      userId,
      preparacion.id
    );

    preparacion.estado = PreparacionEstado.COMPLETADA;
    preparacion.fechaFinalizacion = new Date();
    if (ubicacionDestinoId) preparacion.ubicacionDestinoId = ubicacionDestinoId;

    return this.preparacionRepository.save(preparacion);
  }

  async cancelarPreparacion(id: string): Promise<Preparacion> {
    const preparacion = await this.findOne(id);
    if (preparacion.estado === PreparacionEstado.COMPLETADA) {
      throw new ConflictException(
        'No se puede cancelar una preparación ya completada'
      );
    }

    preparacion.estado = PreparacionEstado.CANCELADA;
    return this.preparacionRepository.save(preparacion);
  }

  async remove(id: string): Promise<void> {
    return this.preparacionRepository.remove(id);
  }
}
