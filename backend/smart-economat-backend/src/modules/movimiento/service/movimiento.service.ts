import { Injectable, NotFoundException } from '@nestjs/common';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

@Injectable()
export class MovimientoService {
  constructor(private readonly movimientoRepo: MovimientoRepository) {}

  create(createMovimiento: CreateMovimientoDto) {
    return this.movimientoRepo.createMovimiento(createMovimiento);
  }

  findAll() {
    return this.movimientoRepo.findAll();
  }

  async findOne(id: number) {
    const mov = await this.movimientoRepo.findById(id);
    if (!mov) throw new NotFoundException('Movimiento no encontrado');
    return mov;
  }

  update(id: number, dto: UpdateMovimientoDto) {
    return this.movimientoRepo.updateMovimiento(id, dto);
  }

  remove(id: number) {
    return this.movimientoRepo.deleteMovimiento(id);
  }

  async getMovimientoHistory(dto: MovimientoHistoryDto): Promise<Movimiento[]> {
    const movimientos = await this.movimientoRepo.findMovimientosByEntity(dto);

    if (!movimientos || movimientos.length === 0) {
      throw new NotFoundException(
        'No se encontraron movimientos para esta entidad'
      );
    }

    return movimientos;
  }
}
