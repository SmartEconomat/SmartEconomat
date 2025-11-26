import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';

@Injectable()
export class RecepcionRepository extends Repository<Recepcion> {
  constructor(private dataSource: DataSource) {
    super(Recepcion, dataSource.createEntityManager());
  }
}
