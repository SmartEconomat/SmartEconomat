/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export enum TipoDiferencia {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  FALTANTE = 'FALTANTE',
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  EXCESO = 'EXCESO',
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  DEFECTUOSO = 'DEFECTUOSO',
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export enum EstadoReclamacion {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  PENDIENTE = 'PENDIENTE',
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  RECLAMADO = 'RECLAMADO',
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ABONADO = 'ABONADO',
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  REENVIADO = 'REENVIADO',
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export enum EstadoIncidencia {
  ABIERTA = 'ABIERTA',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTA = 'RESUELTA',
  NUEVA = 'NUEVA',
  EN_AJUSTE = 'EN_AJUSTE',
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  CANCELADA = 'CANCELADA',
  INVALIDA = 'INVALIDA',
}

/** Catálogo de valores enumerados (EstadoLineaIncidencia) dentro de smart-economat-frontend (SPA). */
export enum EstadoLineaIncidencia {
  SIN_PROBLEMA = 'SIN_PROBLEMA',
  PENDIENTE_AJUSTE = 'PENDIENTE_AJUSTE',
  AJUSTADO = 'AJUSTADO',
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface IncidenciaLinea {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoProductoId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  productoId?: string;
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
  cantidadPedida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadRecibida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadAjustada: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  diferencia: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  tipoDiferencia: TipoDiferencia;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estado: EstadoLineaIncidencia;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  necesitaAjuste: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estadoReclamacion: EstadoReclamacion;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPendiente: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface Incidencia {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  recepcionId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoId?: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  proveedorId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  proveedorNombre: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  motivoIncidencia: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estado: EstadoIncidencia;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observacionesRecepcion?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observacionesResolucion?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  resuelta: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  fechaResolucion?: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPedidaTotal: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadRecibidaTotal: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPendienteTotal: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  lineas: IncidenciaLinea[];
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  createdAt: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface ResolveIncidenciaLineaAdjustment {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoProductoId?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadAjustada?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadRecibida?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estadoReclamacion?: EstadoReclamacion;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface ResolveIncidenciaPayload {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  usuarioId?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observacionesResolucion?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  marcarComoResuelta?: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estadoFinal?: EstadoIncidencia;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  lineas?: ResolveIncidenciaLineaAdjustment[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface IncidenciasQueryParams {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  page?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  limit?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  searchTerm?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  resuelta?: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  startDate?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  endDate?: string;
}
