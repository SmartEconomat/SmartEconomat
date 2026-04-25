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
 * Service that manages the lifecycle of kitchen preparation orders.
 * A Preparacion moves through PENDIENTE → EN_PROCESO → COMPLETADA states, and can
 * be cancelled at any point before completion. Finalising a preparation triggers
 * the production execution pipeline via ProduccionService.
 * @class PreparacionService
 */
@Injectable()
export class PreparacionService {
  constructor(
    private readonly preparacionRepository: PreparacionRepository,
    private readonly produccionService: ProduccionService,
    private readonly recetaRepository: RecetaRepository
  ) {}

  /**
   * Creates a new preparation order linked to a recipe.
   * @param {CreatePreparacionDto} dto - DTO containing recetaId, cantidadAProducir and optional ubicacionDestinoId.
   * @param {string} userId - ID of the authenticated user creating the preparation.
   * @returns {Promise<Preparacion>} The newly created Preparacion entity.
   * @throws {NotFoundException} When the referenced recipe does not exist.
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
   * Returns a paginated list of preparation orders.
   * When a userRole is provided the repository may apply role-based visibility filters.
   * @param {PaginationQueryDto} query - Pagination parameters (page, limit).
   * @param {string} [userRole] - Optional role name used to scope visibility.
   * @returns {Promise<PaginatedResponseDto<Preparacion>>} Paginated result containing items and metadata.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Preparacion>> {
    return this.preparacionRepository.findAllPaginated(query, userRole);
  }

  /**
   * Finds a single preparation order by its ID.
   * @param {string} id - UUID of the Preparacion to retrieve.
   * @param {string} [userRole] - Optional role name used to scope visibility.
   * @returns {Promise<Preparacion>} The found Preparacion entity.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   */
  async findOne(id: string, userRole?: string): Promise<Preparacion> {
    const preparacion = await this.preparacionRepository.findById(id, userRole);
    if (!preparacion) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
    return preparacion;
  }

  /**
   * Transitions a preparation from PENDIENTE to EN_PROCESO, recording the start timestamp.
   * @param {string} id - UUID of the Preparacion to start.
   * @returns {Promise<Preparacion>} The updated Preparacion entity with estado EN_PROCESO.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is not in PENDIENTE state.
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
   * Finalises a preparation in EN_PROCESO state by executing the production pipeline
   * and transitioning the entity to COMPLETADA. Records the finalisation timestamp.
   * @param {string} id - UUID of the Preparacion to finalise.
   * @param {string} userId - ID of the authenticated user performing the action.
   * @param {string} [ubicacionDestinoId] - Override destination location; falls back to the stored value.
   * @returns {Promise<Preparacion>} The updated Preparacion entity with estado COMPLETADA.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is not in EN_PROCESO state.
   * @throws {BadRequestException} When no destination location is available.
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
   * Cancels a preparation that has not yet been completed.
   * @param {string} id - UUID of the Preparacion to cancel.
   * @returns {Promise<Preparacion>} The updated Preparacion entity with estado CANCELADA.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is already in COMPLETADA state.
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
   * Soft-deletes a preparation order by ID.
   * @param {string} id - UUID of the Preparacion to remove.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    return this.preparacionRepository.remove(id);
  }
}
