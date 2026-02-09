import { Injectable, NotFoundException } from '@nestjs/common';
import { MovimientoRepository } from '../repository/movimiento.repository';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';

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
}
