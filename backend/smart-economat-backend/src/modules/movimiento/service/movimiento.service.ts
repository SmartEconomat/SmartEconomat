import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { MovimientoListQueryDto } from '../dto/movimiento-list-query.dto';
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
    query: MovimientoListQueryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    return this.movimientoRepo.findAll(query);
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
   * Documentación en español.
   */
  async getMovimientoHistory(
    dto: MovimientoHistoryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
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

    const result = await this.movimientoRepo.findMovimientosByEntity(dto);

    if (!result.data || result.data.length === 0) {
      throw new NotFoundException(
        'No se encontraron movimientos que coincidan con los criterios especificados'
      );
    }

    return result;
  }
}
