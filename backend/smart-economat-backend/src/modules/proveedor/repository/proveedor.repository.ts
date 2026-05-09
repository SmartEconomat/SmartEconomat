import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Proveedor } from '../proveedor.entity/proveedor.entity';

/** Clase pública (ProveedorRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class ProveedorRepository extends Repository<Proveedor> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(Proveedor, dataSource.createEntityManager());
  }
}
