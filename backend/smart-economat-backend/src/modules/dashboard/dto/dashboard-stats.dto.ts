import { IsDate, IsNumber, IsObject } from 'class-validator';
import type { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';

/** Clase pública (DashboardStatsDto). Paquete: smart-economat-backend (Nest). */
export class DashboardStatsDto {
  @IsNumber()
  totalProductos: number;

  @IsNumber()
  productosEsteMes: number;

  @IsNumber()
  totalProveedores: number;

  @IsObject()
  inventario: {
    valorTotal: number;
    totalItems: number;
    itemsBajoStock: number;
  };

  @IsObject()
  pedidos: {
    pendientes: number;
    completadosHoy: number;
    costeTotalPendiente: number;
    incidencias: number;
  };

  @IsObject()
  alertas: {
    porCaducar: number;
    caducados: number;
  };

  movimientosRecientes: Partial<Movimiento>[];

  /** Timestamp de generación. Permite al cliente saber la antigüedad del dato cacheado. */
  @IsDate()
  generatedAt: Date;
}
