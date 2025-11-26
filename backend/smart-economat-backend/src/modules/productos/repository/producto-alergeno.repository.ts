import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';

@Injectable()
export class ProductoAlergenoRepository extends Repository<ProductoAlergeno> {
  constructor(private dataSource: DataSource) {
    super(ProductoAlergeno, dataSource.createEntityManager());
  }
}
