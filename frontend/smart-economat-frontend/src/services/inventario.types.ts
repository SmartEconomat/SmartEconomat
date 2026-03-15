/**
 * Respuesta cruda del API de inventario (registros por lote/ubicación).
 */
export interface InventarioItem {
  id: string;
  cantidadActual: number;
  cantidadMinima: number;
  cantidadMaxima?: number | null;
  ubicacion?: { id: string; nombre: string; descripcion?: string };
  fechaCaducidad?: string | null;
  productoProveedor?: {
    id: string;
    producto?: { id: string; nombre: string; unidad?: string; tipo?: string };
    proveedor?: { id: string; nombre: string };
  };
}

/**
 * Vista agregada por producto: un solo registro por producto con stock total sumado.
 * Los productos no se duplican; se suman las cantidades de todos los lotes/proveedores.
 */
export interface InventarioPorProducto {
  productoId: string;
  nombre: string;
  unidad?: string;
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
