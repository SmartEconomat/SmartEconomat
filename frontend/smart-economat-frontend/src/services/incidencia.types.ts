/**
 * Documentación en español.
 */
export enum TipoDiferencia {
        /**
     * Documentación en español.
     */
  FALTANTE = 'FALTANTE',
        /**
     * Documentación en español.
     */
  EXCESO = 'EXCESO',
        /**
     * Documentación en español.
     */
  DEFECTUOSO = 'DEFECTUOSO',
}

/**
 * Documentación en español.
 */
export enum EstadoReclamacion {
        /**
     * Documentación en español.
     */
  PENDIENTE = 'PENDIENTE',
        /**
     * Documentación en español.
     */
  RECLAMADO = 'RECLAMADO',
        /**
     * Documentación en español.
     */
  ABONADO = 'ABONADO',
        /**
     * Documentación en español.
     */
  REENVIADO = 'REENVIADO',
}

/**
 * Documentación en español.
 */
export enum EstadoIncidencia {
        /**
     * Documentación en español.
     */
  NUEVA = 'nueva',
        /**
     * Documentación en español.
     */
  EN_AJUSTE = 'en_ajuste',
        /**
     * Documentación en español.
     */
  PENDIENTE_VALIDACION = 'pendiente_validacion',
        /**
     * Documentación en español.
     */
  RESUELTA = 'resuelta',
        /**
     * Documentación en español.
     */
  CANCELADA = 'cancelada',
        /**
     * Documentación en español.
     */
  INVALIDA = 'invalida',
}

/**
 * Documentación en español.
 */
export interface IncidenciaLinea {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  pedidoProductoId: string;
        /**
     * Documentación en español.
     */
  productoId?: string;
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
  cantidadEsperada: number;
        /**
     * Documentación en español.
     */
  cantidadRecibida: number;
        /**
     * Documentación en español.
     */
  cantidadPendiente: number;
        /**
     * Documentación en español.
     */
  diferencia: number;
        /**
     * Documentación en español.
     */
  tipoDiferencia: TipoDiferencia;
        /**
     * Documentación en español.
     */
  estadoReclamacion: EstadoReclamacion;
        /**
     * Documentación en español.
     */
  observaciones?: string;
}

/**
 * Documentación en español.
 */
export interface Incidencia {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  recepcionId: string;
        /**
     * Documentación en español.
     */
  pedidoId: string | null;
        /**
     * Documentación en español.
     */
  proveedorNombre: string;
        /**
     * Documentación en español.
     */
  motivoIncidencia: string;
        /**
     * Documentación en español.
     */
  estado: EstadoIncidencia;
        /**
     * Documentación en español.
     */
  observacionesRecepcion?: string;
        /**
     * Documentación en español.
     */
  observacionesResolucion?: string;
        /**
     * Documentación en español.
     */
  resuelta: boolean;
        /**
     * Documentación en español.
     */
  fechaResolucion?: string;
        /**
     * Documentación en español.
     */
  cantidadPedidaTotal: number;
        /**
     * Documentación en español.
     */
  cantidadRecibidaTotal: number;
        /**
     * Documentación en español.
     */
  cantidadPendienteTotal: number;
        /**
     * Documentación en español.
     */
  lineas: IncidenciaLinea[];
        /**
     * Documentación en español.
     */
  createdAt: string;
}

/**
 * Documentación en español.
 */
export interface ResolveIncidenciaLineaAdjustment {
        /**
     * Documentación en español.
     */
  id?: string;
        /**
     * Documentación en español.
     */
  pedidoProductoId?: string;
        /**
     * Documentación en español.
     */
  ajusteCantidad?: number;
        /**
     * Documentación en español.
     */
  cantidadRecibida?: number;
        /**
     * Documentación en español.
     */
  estadoReclamacion?: EstadoReclamacion;
        /**
     * Documentación en español.
     */
  observaciones?: string;
}

/**
 * Documentación en español.
 */
export interface ResolveIncidenciaPayload {
        /**
     * Documentación en español.
     */
  usuarioId?: string;
        /**
     * Documentación en español.
     */
  observacionesResolucion?: string;
        /**
     * Documentación en español.
     */
  marcarComoResuelta?: boolean;
        /**
     * Documentación en español.
     */
  estadoFinal?:
    | EstadoIncidencia.RESUELTA
    | EstadoIncidencia.CANCELADA
    | EstadoIncidencia.INVALIDA;
        /**
     * Documentación en español.
     */
  lineas?: ResolveIncidenciaLineaAdjustment[];
}

/**
 * Documentación en español.
 */
export interface IncidenciasQueryParams {
        /**
     * Documentación en español.
     */
  page?: number;
        /**
     * Documentación en español.
     */
  limit?: number;
        /**
     * Documentación en español.
     */
  searchTerm?: string;
        /**
     * Documentación en español.
     */
  resuelta?: boolean;
        /**
     * Documentación en español.
     */
  startDate?: string;
        /**
     * Documentación en español.
     */
  endDate?: string;
}
