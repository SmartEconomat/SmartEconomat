import { DataSource, Repository } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Injectable } from '@nestjs/common';

/**
 * @description Custom TypeORM repository for the Producto entity.
 * Extends the base Repository with domain-specific query methods.
 */
@Injectable()
export class ProductoRepository extends Repository<Producto> {
  /**
   * @description Constructs the repository by wiring it to the TypeORM DataSource.
   * @param dataSource - The active TypeORM DataSource used to create the entity manager.
   */
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }

  /**
   * @description Checks whether a Producto with the given barcode already exists.
   * @param codigoBarras - The barcode string to look up.
   * @returns `true` if at least one Producto with this barcode exists, `false` otherwise.
   */
  async existsByCodigoBarras(codigoBarras: string): Promise<boolean> {
    const count = await this.count({ where: { codigoBarras } });
    return count > 0;
  }
}
