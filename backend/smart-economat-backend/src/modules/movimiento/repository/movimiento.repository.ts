import { DataSource, Repository } from 'typeorm';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MovimientoRepository extends Repository<Movimiento> {
  constructor(private dataSource: DataSource) {
    super(Movimiento, dataSource.createEntityManager());
  }
}
