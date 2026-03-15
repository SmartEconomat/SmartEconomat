import { Injectable } from '@nestjs/common';
import { MovimientoService } from '../service/movimiento.service';
import { MovimientoPort } from '../ports/movimiento.port';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

@Injectable()
export class MovimientoAdapter implements MovimientoPort {
  constructor(private readonly movimientoService: MovimientoService) {}

  create(dto: CreateMovimientoDto): Promise<Movimiento> {
    return this.movimientoService.create(dto);
  }
}
