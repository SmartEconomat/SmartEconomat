/**
 * Describes the type of quantity discrepancy found during a reception.
 */
export enum TipoDiferencia {
  /** Fewer units were received than ordered. */
  FALTANTE = 'FALTANTE',
  /** More units were received than ordered. */
  EXCESO = 'EXCESO',
  /** Units were received but are damaged or defective. */
  DEFECTUOSO = 'DEFECTUOSO',
}

/**
 * Tracks the claim/resolution status of a single incidence line.
 */
export enum EstadoReclamacion {
  /** No action taken yet. */
  PENDIENTE = 'PENDIENTE',
  /** A formal claim has been submitted to the supplier. */
  RECLAMADO = 'RECLAMADO',
  /** The supplier has issued a credit note. */
  ABONADO = 'ABONADO',
  /** The supplier has reshipped the missing/defective items. */
  REENVIADO = 'REENVIADO',
}

/**
 * Overall lifecycle state of an incidence record.
 */
export enum EstadoIncidencia {
  /** Newly created, not yet reviewed. */
  NUEVA = 'nueva',
  /** Under review; at least one line has an active claim. */
  EN_AJUSTE = 'en_ajuste',
  /** All lines have been acted on; awaiting final validation. */
  PENDIENTE_VALIDACION = 'pendiente_validacion',
  /** Incidence fully resolved. */
  RESUELTA = 'resuelta',
  /** Incidence cancelled by a user. */
  CANCELADA = 'cancelada',
  /** Incidence marked as invalid (e.g. data entry error). */
  INVALIDA = 'invalida',
}

/**
 * Represents a single product line within an incidence.
 */
export interface IncidenciaLinea {
  /** Unique identifier. */
  id: string;
  /** Foreign key referencing the original order product. */
  pedidoProductoId: string;
  /** Optional product identifier (populated when the relation is loaded). */
  productoId?: string;
  /** Display name of the product. */
  nombreProducto: string;
  /** Unit of measure for the product. */
  unidad?: string;
  /** Quantity that was expected according to the order. */
  cantidadEsperada: number;
  /** Quantity that was actually received. */
  cantidadRecibida: number;
  /** Remaining quantity not yet received or resolved (cantidadEsperada - cantidadRecibida). */
  cantidadPendiente: number;
  /** Signed difference (cantidadRecibida - cantidadEsperada). */
  diferencia: number;
  /** Type of discrepancy (shortage, excess, defective). */
  tipoDiferencia: TipoDiferencia;
  /** Current claim status for this line. */
  estadoReclamacion: EstadoReclamacion;
  /** Optional free-text observations. */
  observaciones?: string;
}

/**
 * Represents a full incidence record as used in the frontend.
 */
export interface Incidencia {
  /** Unique identifier. */
  id: string;
  /** Identifier of the reception that triggered this incidence. */
  recepcionId: string;
  /** Optional identifier of the associated pedido. */
  pedidoId: string | null;
  /** Display name of the supplier involved. */
  proveedorNombre: string;
  /** Human-readable summary of why the incidence was raised. */
  motivoIncidencia: string;
  /** Current lifecycle state. */
  estado: EstadoIncidencia;
  /** Optional observations recorded at reception time. */
  observacionesRecepcion?: string;
  /** Optional observations recorded when the incidence was resolved. */
  observacionesResolucion?: string;
  /** Whether the incidence has been fully resolved. */
  resuelta: boolean;
  /** ISO timestamp when the incidence was resolved, if applicable. */
  fechaResolucion?: string;
  /** Sum of cantidadEsperada across all lines. */
  cantidadPedidaTotal: number;
  /** Sum of cantidadRecibida across all lines. */
  cantidadRecibidaTotal: number;
  /** Sum of cantidadPendiente across all lines. */
  cantidadPendienteTotal: number;
  /** Individual product lines. */
  lineas: IncidenciaLinea[];
  /** ISO timestamp when the incidence was created. */
  createdAt: string;
}

/**
 * Adjustment data for a single line when resolving an incidence.
 */
export interface ResolveIncidenciaLineaAdjustment {
  /** Line identifier (required when updating an existing line). */
  id?: string;
  /** Foreign key of the pedido product to adjust. */
  pedidoProductoId?: string;
  /** Delta to apply to the received quantity. */
  ajusteCantidad?: number;
  /** Absolute received quantity to set. */
  cantidadRecibida?: number;
  /** New claim status for the line. */
  estadoReclamacion?: EstadoReclamacion;
  /** Free-text observations for the line. */
  observaciones?: string;
}

/**
 * Payload for the resolve-incidence endpoint.
 */
export interface ResolveIncidenciaPayload {
  /** Optional identifier of the user performing the resolution. */
  usuarioId?: string;
  /** Free-text observations about the resolution. */
  observacionesResolucion?: string;
  /** Whether to mark the incidence as fully resolved. */
  marcarComoResuelta?: boolean;
  /** Desired final state of the incidence. */
  estadoFinal?:
    | EstadoIncidencia.RESUELTA
    | EstadoIncidencia.CANCELADA
    | EstadoIncidencia.INVALIDA;
  /** Individual line adjustments to apply. */
  lineas?: ResolveIncidenciaLineaAdjustment[];
}

/**
 * Query parameters accepted by the paginated incidencias list endpoint.
 */
export interface IncidenciasQueryParams {
  /** Page number (1-based). */
  page?: number;
  /** Number of items per page. */
  limit?: number;
  /** Free-text search term. */
  searchTerm?: string;
  /** Filter by resolution state. */
  resuelta?: boolean;
  /** ISO start date for date range filter. */
  startDate?: string;
  /** ISO end date for date range filter. */
  endDate?: string;
}
