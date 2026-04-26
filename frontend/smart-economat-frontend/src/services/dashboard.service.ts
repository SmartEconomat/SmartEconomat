import { baseFetch, ApiResponse } from './api.service';

export interface DashboardMovimiento {
  id: string;
  tipo: string;
  cantidad: number;
  entidad: string;
  entidadId: string;
  createdAt: string;
  descripcion?: string;
  productoNombre?: string;
  usuario?: { id: string; nombre?: string; username: string; email: string };
}

export interface DashboardStats {
  totalProductos: number;
  productosEsteMes: number;
  totalProveedores: number;
  inventario: {
    valorTotal: number;
    totalItems: number;
    itemsBajoStock: number;
  };
  pedidos: {
    pendientes: number;
    completadosHoy: number;
    incidencias: number;
    costeTotalPendiente: number;
  };
  alertas: {
    porCaducar: number;
    caducados: number;
  };
  movimientosRecientes: DashboardMovimiento[];
}

/**
 * Documentación en español.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await baseFetch('/dashboard/stats');
  if (!response.ok) {
    throw new Error(
      `Error al obtener estadísticas del dashboard: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<DashboardStats>;
  return body.data;
}
