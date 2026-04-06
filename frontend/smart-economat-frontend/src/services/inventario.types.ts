/**
 * Respuesta del endpoint /alertas/stock con información enriquecida.
 */
export interface AlertaStock {
  id: string;
  cantidadActual: number;
  cantidadMinima: number;
  nombreProducto: string;
  unidad?: string;
  proveedorNombre?: string;
  ubicacionNombre?: string;
}

/**
 * Respuesta cruda del API de inventario (registros por lote/ubicación).
 */
export interface InventarioItem {
  id: string;
  deletedAt?: string | null;
  cantidadActual: number;
  cantidadMinima: number;
  cantidadMaxima?: number | null;
  ubicacion?: { id: string; nombre: string; descripcion?: string };
  fechaCaducidad?: string | null;
  productoProveedor?: {
    id: string;
    producto?: {
      id: string;
      nombre: string;
      codigoBarras?: string;
      unidad?: string;
      contenido?: number;
      tipo?: string;
    };
    proveedor?: { id: string; nombre: string };
  };
}

/**
 * Tipos permitidos para ajustes manuales de stock desde inventario.
 */
export type TipoMovimientoManualAjuste = 'entrada' | 'salida_ajuste';

/**
 * Payload para registrar un ajuste manual por delta sobre un lote de inventario.
 */
export interface CreateAjusteManualInventarioPayload {
  inventarioId: string;
  tipo: TipoMovimientoManualAjuste;
  ajuste: number;
  motivo: string;
  observaciones?: string;
}

/**
 * Vista agregada por producto: un solo registro por producto con stock total sumado.
 * Los productos no se duplican; se suman las cantidades de todos los lotes/proveedores.
 */
export interface InventarioPorProducto {
  productoId: string;
  nombre: string;
  codigoBarras?: string;
  unidad?: string;
  contenidoPorUnidad?: number;
  tipo?: string;
  cantidadTotal: number;
  cantidadMinima: number;
  bajoStock: boolean;
  proveedores: string[];
  /**
   * Ubicaciones donde existe stock del producto (agregado de todos los lotes).
   * Se usa sobre todo para filtros/ búsquedas en el cliente.
   */
  ubicaciones?: string[];
}
