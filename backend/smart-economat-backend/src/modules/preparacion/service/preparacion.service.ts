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

/**
 * Documentación en español.
 */
@Injectable()
export class PreparacionService {
  constructor(
    private readonly preparacionRepository: PreparacionRepository,
    private readonly produccionService: ProduccionService,
    private readonly recetaRepository: RecetaRepository
  ) {}

        /**
     * Documentación en español.
     */
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

        /**
     * Documentación en español.
     */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Preparacion>> {
    return this.preparacionRepository.findAllPaginated(query, userRole);
  }

        /**
     * Documentación en español.
     */
  async findOne(id: string, userRole?: string): Promise<Preparacion> {
    const preparacion = await this.preparacionRepository.findById(id, userRole);
    if (!preparacion) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
    return preparacion;
  }

        /**
     * Documentación en español.
     */
  async iniciarPreparacion(id: string): Promise<Preparacion> {
    const preparacion = await this.findOne(id);
    if (preparacion.estado !== PreparacionEstado.PENDIENTE) {
      throw new ConflictException(
        I18nHelper.getError('PREPARACION_CANNOT_START', {
          estado: preparacion.estado,
        })
      );
    }

    preparacion.estado = PreparacionEstado.EN_PROCESO;
    preparacion.fechaInicio = new Date();
    return this.preparacionRepository.save(preparacion);
  }

        /**
     * Documentación en español.
     */
  async finalizarPreparacion(
    id: string,
    userId: string,
    ubicacionDestinoId?: string
  ): Promise<Preparacion> {
    const preparacion = await this.findOne(id);

    if (preparacion.estado !== PreparacionEstado.EN_PROCESO) {
      throw new ConflictException(
        I18nHelper.getError('PREPARACION_MUST_BE_IN_PROCESS', {
          estado: preparacion.estado,
        })
      );
    }

    const destinoId = ubicacionDestinoId || preparacion.ubicacionDestinoId;
    if (!destinoId) {
      throw new BadRequestException(
        I18nHelper.getError('PREPARACION_MISSING_DESTINATION')
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

        /**
     * Documentación en español.
     */
  async cancelarPreparacion(id: string): Promise<Preparacion> {
    const preparacion = await this.findOne(id);
    if (preparacion.estado === PreparacionEstado.COMPLETADA) {
      throw new ConflictException(
        I18nHelper.getError('PREPARACION_ALREADY_COMPLETED')
      );
    }

    preparacion.estado = PreparacionEstado.CANCELADA;
    return this.preparacionRepository.save(preparacion);
  }

        /**
     * Documentación en español.
     */
  async remove(id: string): Promise<void> {
    return this.preparacionRepository.remove(id);
  }
}
