import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Proveedor } from '../proveedor.entity/proveedor.entity';

@Injectable()
export class ProveedorRepository extends Repository<Proveedor> {
  constructor(private dataSource: DataSource) {
    super(Proveedor, dataSource.createEntityManager());
  }
}
