import { IsNumber, IsObject } from 'class-validator';

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
  };

  @IsObject()
  alertas: {
    porCaducar: number;
    caducados: number;
  };

  movimientosRecientes: any[];
}
