import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Inventario } from '../inventario.entity/inventario.entity';

@Injectable()
export class InventarioRepository extends Repository<Inventario> {
  constructor(private dataSource: DataSource) {
    super(Inventario, dataSource.createEntityManager());
  }
}
