import { DataSource, Repository } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Injectable } from '@nestjs/common';

/**
 * Documentación en español.
 */
@Injectable()
export class ProductoRepository extends Repository<Producto> {
  /**
   * Documentación en español.
   */
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }

  /**
   * Documentación en español.
   */
  async existsByCodigoBarras(codigoBarras: string): Promise<boolean> {
    const count = await this.count({ where: { codigoBarras } });
    return count > 0;
  }
}
