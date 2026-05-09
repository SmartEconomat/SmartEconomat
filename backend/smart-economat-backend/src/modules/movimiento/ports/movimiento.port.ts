import { EntityManager } from 'typeorm';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

/** Clase pública (MovimientoPort). Paquete: smart-economat-backend (Nest). */
export abstract class MovimientoPort {
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMovimientoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {EntityManager | undefined} manager - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  abstract create(
    dto: CreateMovimientoDto,
    manager?: EntityManager
  ): Promise<Movimiento>;
}
