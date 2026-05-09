import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { MovimientoService } from '../service/movimiento.service';
import { MovimientoPort } from '../ports/movimiento.port';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

/** Clase pública (MovimientoAdapter). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class MovimientoAdapter implements MovimientoPort {
  /**
   * Construye la instancia configurada.
   * @undefined {MovimientoService} movimientoService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly movimientoService: MovimientoService) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMovimientoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  create(
    dto: CreateMovimientoDto,
    manager?: EntityManager
  ): Promise<Movimiento> {
    return this.movimientoService.create(dto, manager);
  }
}
