/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface AlertaStock {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadActual: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadMinima: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  nombreProducto: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  unidad?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  proveedorNombre?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionNombre?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface InventarioItem {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  deletedAt?: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadActual: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadMinima: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadMaxima?: number | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacion?: { id: string; nombre: string; descripcion?: string };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  fechaCaducidad?: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type TipoMovimientoManualAjuste = 'entrada' | 'salida_ajuste';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface CreateAjusteManualInventarioPayload {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  inventarioId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  tipo: TipoMovimientoManualAjuste;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ajuste: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  motivo: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Línea solicitada al backend para trasladar stock entre nodos logísticos.
 */
export interface TransferenciaInventarioLineaPayload {
  inventarioOrigenId: string;
  ubicacionDestinoId: string;
  cantidad: number;
}

/**
 * Payload del caso de uso de transferencia inmediata (cabecera + líneas).
 */
export interface CrearTransferenciaInventarioPayload {
  idempotenciaKey?: string;
  observaciones?: string;
  lineas: TransferenciaInventarioLineaPayload[];
}

/**
 * Respuesta mínima tras ejecutar una transferencia en servidor (solo datos necesarios en FE).
 */
export interface TransferenciaInventarioEjecutada {
  id: string;
  estado?: string;
}

export interface InventarioPorProducto {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  productoId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  nombre: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  codigoBarras?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  unidad?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  contenidoPorUnidad?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  tipo?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadTotal: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadMinima: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  bajoStock: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  proveedores: string[];
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicaciones?: string[];
}
