import { DataSource, Repository } from 'typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { Injectable } from '@nestjs/common';

/**
 * Repositorio para operaciones de persistencia de producto.
 */
@Injectable()
export class ProductoRepository extends Repository<Producto> {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private dataSource Parámetro de entrada para la operación.
   */
  constructor(private dataSource: DataSource) {
    super(Producto, dataSource.createEntityManager());
  }

  /**
   * Ejecuta la lógica de exists by codigo barras dentro del flujo de la aplicación.
   *
   * @param codigoBarras Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async existsByCodigoBarras(codigoBarras: string): Promise<boolean> {
    const count = await this.count({ where: { codigoBarras } });
    return count > 0;
  }

  /**
   * Comprueba si ya existe un producto activo con el mismo nombre (trim + comparación insensible a mayúsculas).
   */
  async existsActiveByNombreNormalized(
    nombre: string,
    excludeId?: string
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .andWhere('LOWER(TRIM(p.nombre)) = LOWER(TRIM(:nombre))', { nombre });
    if (excludeId) {
      qb.andWhere('p.id <> :excludeId', { excludeId });
    }
    return (await qb.getCount()) > 0;
  }
}
