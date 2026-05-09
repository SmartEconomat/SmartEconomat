import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';

/** Clase pública (AlbaranRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class AlbaranRepository extends Repository<Albaran> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(Albaran, dataSource.createEntityManager());
  }
}
