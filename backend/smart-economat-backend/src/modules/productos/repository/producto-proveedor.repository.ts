import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Injectable()
export class ProductoProveedorRepository extends Repository<ProductoProveedor> {
  constructor(private dataSource: DataSource) {
    super(ProductoProveedor, dataSource.createEntityManager());
  }
}
