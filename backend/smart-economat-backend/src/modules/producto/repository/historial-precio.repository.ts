import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

/** Clase pública (HistorialPrecioRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class HistorialPrecioRepository extends Repository<HistorialPrecio> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(HistorialPrecio, dataSource.createEntityManager());
  }

  /**
   * Expone "findOneWithRelations" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio | null>} Datos efectivos después de ejecutar la operación.
   */
  findOneWithRelations(id: string): Promise<HistorialPrecio | null> {
    return this.findOne({
      where: { id },
      relations: ['productoProveedor'],
    });
  }

  /**
   * Expone "findAllWithRelations" en smart-economat-backend (Nest).
   * @undefined {"ASC" | "DESC"} order - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio[]>} Datos efectivos después de ejecutar la operación.
   */
  findAllWithRelations(
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<HistorialPrecio[]> {
    return this.find({
      relations: ['productoProveedor'],
      order: { fecha: order },
    });
  }
}
