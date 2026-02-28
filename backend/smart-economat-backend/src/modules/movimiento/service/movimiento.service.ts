import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class MovimientoService {
  constructor(private readonly movimientoRepo: MovimientoRepository) {}

  create(createMovimiento: CreateMovimientoDto) {
    return this.movimientoRepo.createMovimiento(createMovimiento);
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    return this.movimientoRepo.findAll(query) as Promise<
      PaginatedResponseDto<Movimiento>
    >;
  }

  async findOne(id: string) {
    const mov = await this.movimientoRepo.findById(id);
    if (!mov) {
      throw new NotFoundException(I18nHelper.getError('MOVEMENT_NOT_FOUND'));
    }
    return mov;
  }

  update(id: string, dto: UpdateMovimientoDto) {
    return this.movimientoRepo.updateMovimiento(id, dto);
  }

  async remove(id: string) {
    const result = await this.movimientoRepo.deleteMovimiento(id);
    if (!result.affected) {
      throw new NotFoundException(I18nHelper.getError('MOVEMENT_NOT_FOUND'));
    }
  }

  /**
   * Obtiene el historial de movimientos de un producto o usuario.
   *
   * @param dto - DTOs con filtros (entityId, userId, type, startDate, endDate, sortBy, sortOrder)
   * @returns Array de movimientos ordenados cronológicamente
   * @throws BadRequestException si no proporciona entityId o userId
   * @throws NotFoundException si no hay movimientos que coincidan
   * @throws ForbiddenException si intenta acceder a datos no autorizados
   *
   * @example
   *
   * getMovimientoHistory({ entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' })
   *
   *
   * getMovimientoHistory({
   *   entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
   *   type: 'ENTRADA',
   *   startDate: '2026-01-01',
   *   endDate: '2026-02-28',
   *   sortBy: 'createdAt',
   *   sortOrder: 'DESC'
   * })
   */
  async getMovimientoHistory(dto: MovimientoHistoryDto): Promise<Movimiento[]> {
    if (!dto.entityId && !dto.userId) {
      throw new BadRequestException(
        'Debe proporcionar entityId (ProductoProveedor) o userId (Usuario) para buscar el historial'
      );
    }

    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      if (startDate > endDate) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser posterior a la fecha de fin'
        );
      }
    }

    const movimientos = await this.movimientoRepo.findMovimientosByEntity(dto);

    if (!movimientos || movimientos.length === 0) {
      throw new NotFoundException(
        'No se encontraron movimientos que coincidan con los criterios especificados'
      );
    }

    return movimientos;
  }
}
