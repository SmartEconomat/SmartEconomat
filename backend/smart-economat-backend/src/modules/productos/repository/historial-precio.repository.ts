import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

@Injectable()
export class HistorialPrecioRepository extends Repository<HistorialPrecio> {
  constructor(private dataSource: DataSource) {
    super(HistorialPrecio, dataSource.createEntityManager());
  }
}
