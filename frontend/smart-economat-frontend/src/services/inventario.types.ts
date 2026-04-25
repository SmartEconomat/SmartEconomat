/**
 * Respuesta del endpoint /alertas/stock con información enriquecida.
 */
export interface AlertaStock {
  /** Unique identifier of the inventory item triggering the alert. */
  id: string;
  /** Current quantity in stock. */
  cantidadActual: number;
  /** Minimum quantity threshold. */
  cantidadMinima: number;
  /** Display name of the product. */
  nombreProducto: string;
  /** Unit of measure (e.g. KG, UNIDAD). */
  unidad?: string;
  /** Name of the supplier for this stock item. */
  proveedorNombre?: string;
  /** Name of the storage location for this stock item. */
  ubicacionNombre?: string;
}

/**
 * Respuesta cruda del API de inventario (registros por lote/ubicación).
 */
export interface InventarioItem {
  /** Unique identifier of the inventory lot record. */
  id: string;
  /** ISO timestamp when the record was soft-deleted, or null if active. */
  deletedAt?: string | null;
  /** Current quantity in this lot. */
  cantidadActual: number;
  /** Minimum quantity threshold for this lot. */
  cantidadMinima: number;
  /** Optional maximum quantity limit for this lot. */
  cantidadMaxima?: number | null;
  /** Storage location where this lot is kept. */
  ubicacion?: { id: string; nombre: string; descripcion?: string };
  /** Expiry date of this lot, or null if no expiry applies. */
  fechaCaducidad?: string | null;
  /** Product-supplier relation for this lot. */
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
  /** Identifier of the inventory lot to adjust. */
  inventarioId: string;
  /** Direction of the adjustment (entry or exit). */
  tipo: TipoMovimientoManualAjuste;
  /** Absolute quantity delta to apply (positive). */
  ajuste: number;
  /** Required reason for the adjustment. */
  motivo: string;
  /** Optional free-text observations. */
  observaciones?: string;
}

/**
 * Vista agregada por producto: un solo registro por producto con stock total sumado.
 * Los productos no se duplican; se suman las cantidades de todos los lotes/proveedores.
 */
export interface InventarioPorProducto {
  /** Unique product identifier. */
  productoId: string;
  /** Product display name. */
  nombre: string;
  /** Optional barcode of the product. */
  codigoBarras?: string;
  /** Unit of measure. */
  unidad?: string;
  /** Content quantity per unit (e.g. grams per pack). */
  contenidoPorUnidad?: number;
  /** Product category / type. */
  tipo?: string;
  /** Total current quantity across all lots and suppliers. */
  cantidadTotal: number;
  /** Sum of minimum thresholds across all lots. */
  cantidadMinima: number;
  /** Whether at least one lot is below its minimum threshold. */
  bajoStock: boolean;
  /** Names of suppliers that have stock for this product. */
  proveedores: string[];
  /**
   * Ubicaciones donde existe stock del producto (agregado de todos los lotes).
   * Se usa sobre todo para filtros/ búsquedas en el cliente.
   */
  ubicaciones?: string[];
}
