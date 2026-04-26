/**
 * Documentación en español.
 */
export interface AlertaStock {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  cantidadActual: number;
        /**
     * Documentación en español.
     */
  cantidadMinima: number;
        /**
     * Documentación en español.
     */
  nombreProducto: string;
        /**
     * Documentación en español.
     */
  unidad?: string;
        /**
     * Documentación en español.
     */
  proveedorNombre?: string;
        /**
     * Documentación en español.
     */
  ubicacionNombre?: string;
}

/**
 * Documentación en español.
 */
export interface InventarioItem {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  deletedAt?: string | null;
        /**
     * Documentación en español.
     */
  cantidadActual: number;
        /**
     * Documentación en español.
     */
  cantidadMinima: number;
        /**
     * Documentación en español.
     */
  cantidadMaxima?: number | null;
        /**
     * Documentación en español.
     */
  ubicacion?: { id: string; nombre: string; descripcion?: string };
        /**
     * Documentación en español.
     */
  fechaCaducidad?: string | null;
        /**
     * Documentación en español.
     */
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
 * Documentación en español.
 */
export type TipoMovimientoManualAjuste = 'entrada' | 'salida_ajuste';

/**
 * Documentación en español.
 */
export interface CreateAjusteManualInventarioPayload {
        /**
     * Documentación en español.
     */
  inventarioId: string;
        /**
     * Documentación en español.
     */
  tipo: TipoMovimientoManualAjuste;
        /**
     * Documentación en español.
     */
  ajuste: number;
        /**
     * Documentación en español.
     */
  motivo: string;
        /**
     * Documentación en español.
     */
  observaciones?: string;
}

/**
 * Documentación en español.
 */
export interface InventarioPorProducto {
        /**
     * Documentación en español.
     */
  productoId: string;
        /**
     * Documentación en español.
     */
  nombre: string;
        /**
     * Documentación en español.
     */
  codigoBarras?: string;
        /**
     * Documentación en español.
     */
  unidad?: string;
        /**
     * Documentación en español.
     */
  contenidoPorUnidad?: number;
        /**
     * Documentación en español.
     */
  tipo?: string;
        /**
     * Documentación en español.
     */
  cantidadTotal: number;
        /**
     * Documentación en español.
     */
  cantidadMinima: number;
        /**
     * Documentación en español.
     */
  bajoStock: boolean;
        /**
     * Documentación en español.
     */
  proveedores: string[];
        /**
     * Documentación en español.
     */
  ubicaciones?: string[];
}
