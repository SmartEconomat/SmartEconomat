import { IsObject } from 'class-validator';

export class DashboardStatsDto {
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
  };

  @IsObject()
  alertas: {
    porCaducar: number;
    caducados: number;
  };

  movimientosRecientes: any[];
}
