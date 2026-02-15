import { Injectable, NotFoundException } from '@nestjs/common';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class MovimientoService {
  constructor(private readonly movimientoRepo: MovimientoRepository) {}

  create(createMovimiento: CreateMovimientoDto) {
    return this.movimientoRepo.createMovimiento(createMovimiento);
  }

  findAll() {
    return this.movimientoRepo.findAll();
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

  remove(id: string) {
    return this.movimientoRepo.deleteMovimiento(id);
  }

  async getMovimientoHistory(dto: MovimientoHistoryDto): Promise<Movimiento[]> {
    const movimientos = await this.movimientoRepo.findMovimientosByEntity(dto);

    if (!movimientos || movimientos.length === 0) {
      throw new NotFoundException(I18nHelper.getError('MOVEMENTS_NOT_FOUND'));
    }

    return movimientos;
  }
}
