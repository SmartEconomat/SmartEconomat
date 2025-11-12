import { DataSource, Repository } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductoRepository extends Repository<Producto> {
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }
}
