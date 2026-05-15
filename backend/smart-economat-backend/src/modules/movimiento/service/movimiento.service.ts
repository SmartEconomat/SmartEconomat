import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { MovimientoListQueryDto } from '../dto/movimiento-list-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { validateDateRange } from '../../../common/utils/date-range.util';
import { TipoMovimiento, AccionMovimiento } from '../enums/movimiento.enums';

/**
 * Servicio encargado de la trazabilidad y registro de movimientos de stock.
 * Gestiona la auditoría de entradas, salidas, mermas y ajustes del inventario.
 */
@Injectable()
export class MovimientoService {
  /**
   * Crea una instancia de MovimientoService.
   * @param movimientoRepo Repositorio especializado para movimientos.
   */
  constructor(private readonly movimientoRepo: MovimientoRepository) {}

  /**
   * Método centralizado para registrar acciones en el sistema (Auditoría).
   * @param params Parámetros de la auditoría.
   * @param manager EntityManager opcional para transacciones.
   */
  /**
   * Expone "log" en smart-economat-backend (Nest).
   * @undefined {{ entity: string; entityId: string; action: AccionMovimiento; description?: string; before?: any; after?: any; userId?: string; tipo?: TipoMovimiento; cantidad?: number; inventarioId?: string; productoProveedorId?: string; }} params - Entrada efectiva esperada por el contrato.
   * @undefined {EntityManager | undefined} manager - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async log(
    params: {
      entity: string;
      entityId: string;
      action: AccionMovimiento;
      description?: string;
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      userId?: string;
      tipo?: TipoMovimiento;
      cantidad?: number;
      inventarioId?: string;
      productoProveedorId?: string;
    },
    manager?: EntityManager
  ) {
    const dto: CreateMovimientoDto = {
      entidadTipo: params.entity,
      entidadId: params.entityId,
      accion: params.action,
      descripcion: params.description,
      datosAntes: params.before,
      datosDespues: params.after,
      usuario: params.userId,
      tipo: params.tipo ?? TipoMovimiento.AUDITORIA,
      cantidad: params.cantidad,
      inventario: params.inventarioId,
      productoProveedor: params.productoProveedorId,
    };

    return this.create(dto, manager);
  }

  /**
   * Registra un nuevo movimiento de stock.
   * @param createMovimiento Datos del movimiento.
   * @param manager EntityManager opcional.
   * @returns El registro persistido.
   */
  create(createMovimiento: CreateMovimientoDto, manager?: EntityManager) {
    return this.movimientoRepo.createMovimiento(createMovimiento, manager);
  }

  /**
   * Obtiene una lista paginada de todos los movimientos.
   * @param query Parámetros de paginación y ordenación.
   * @returns Respuesta paginada.
   */
  async findAll(
    query: MovimientoListQueryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    validateDateRange(query.startDate, query.endDate, 365, 'Movimientos');
    return this.movimientoRepo.findAll(query);
  }

  /**
   * Busca un movimiento por su UUID.
   * @param id UUID del movimiento.
   * @returns El movimiento encontrado.
   * @throws NotFoundException Si el registro no existe.
   */
  async findOne(id: string) {
    const mov = await this.movimientoRepo.findById(id);
    if (!mov) {
      throw new NotFoundException(I18nHelper.getError('MOVEMENT_NOT_FOUND'));
    }
    return mov;
  }

  /**
   * Actualiza un registro de movimiento.
   * @param id UUID del registro.
   * @param dto Datos a actualizar.
   * @returns El movimiento actualizado.
   */
  update(id: string, dto: UpdateMovimientoDto) {
    return this.movimientoRepo.updateMovimiento(id, dto);
  }

  /**
   * Elimina un registro de movimiento del sistema (eliminación lógica).
   * @param id UUID del movimiento.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string) {
    const result = await this.movimientoRepo.deleteMovimiento(id);
    if (!result.affected) {
      throw new NotFoundException(I18nHelper.getError('MOVEMENT_NOT_FOUND'));
    }
  }

  /**
   * Obtiene la trazabilidad detallada de un producto o un usuario específico.
   * @param dto Parámetros de filtrado para el historial.
   * @returns Lista paginada con el historial de movimientos.
   * @throws BadRequestException Si no se proporcionan los criterios mínimos o las fechas son inconsistentes.
   */
  async getMovimientoHistory(
    dto: MovimientoHistoryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    if (!dto.entityId && !dto.userId) {
      throw new BadRequestException(
        'Debe proporcionar entityId (ProductoProveedor) o userId (Usuario) para buscar el historial'
      );
    }

    validateDateRange(
      dto.startDate,
      dto.endDate,
      365,
      'Historial de movimientos'
    );

    const result = await this.movimientoRepo.findMovimientosByEntity(dto);

    if (!result.data || result.data.length === 0) {
      throw new NotFoundException(
        'No se encontraron movimientos que coincidan con los criterios especificados'
      );
    }

    return result;
  }
}
