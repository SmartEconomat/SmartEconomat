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
 * Servicio de dominio para preparacion.
 */
@Injectable()
export class PreparacionService {
  /**
   * Construye la instancia configurada.
   * @undefined {PreparacionRepository} preparacionRepository - Entrada efectiva esperada por el contrato.
   * @undefined {ProduccionService} produccionService - Entrada efectiva esperada por el contrato.
   * @undefined {RecetaRepository} recetaRepository - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly preparacionRepository: PreparacionRepository,
    private readonly produccionService: ProduccionService,
    private readonly recetaRepository: RecetaRepository
  ) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePreparacionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Preparacion>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Preparacion>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Preparacion>> {
    return this.preparacionRepository.findAllPaginated(query, userRole);
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @param userRole Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string, userRole?: string): Promise<Preparacion> {
    const preparacion = await this.preparacionRepository.findById(id, userRole);
    if (!preparacion) {
      throw new NotFoundException(I18nHelper.getError('PREPARACION_NOT_FOUND'));
    }
    return preparacion;
  }

  /**
   * Ejecuta la lógica de iniciar preparacion dentro del flujo de la aplicación.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "finalizarPreparacion" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} ubicacionDestinoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Preparacion>} Datos efectivos después de ejecutar la operación.
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
        cantidadAProducir: preparacion.cantidadAProducir,
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
   * Determina si cancelar preparacion.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    return this.preparacionRepository.remove(id);
  }
}
