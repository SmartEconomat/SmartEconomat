/**
 * A single product line within a distributable pedido-usuario.
 */
export interface DistribucionDisponibleLinea {
  /** Unique identifier of the pedido-usuario line. */
  pedidoUsuarioLineaId: string;
  /** Identifier of the product-supplier relation. */
  productoProveedorId: string;
  /** Display name of the product. */
  productoNombre: string;
  /** Quantity the user originally ordered. */
  cantidadPedida: number;
  /** Quantity that has been received/validated in warehouse. */
  cantidadRecepcionada: number;
  /** Quantity already assigned to previous distributions. */
  cantidadDistribuida: number;
  /** Remaining quantity available for distribution. */
  cantidadPendiente: number;
}

/**
 * Summary of a pedido-usuario that is available for distribution.
 */
export interface DistribucionDisponible {
  /** Identifier of the pedido-usuario. */
  pedidoUsuarioId: string;
  /** Human-readable global order number. */
  numeroGlobal: string;
  /** Current order status. */
  estado: string;
  /** The user who placed the order, if available. */
  usuario: {
    id?: string;
    nombre?: string;
    username?: string;
  } | null;
  /** Classroom slot assigned to the student, if applicable. */
  alumnoSlot: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacionId?: string;
    ubicacionNombre?: string;
  } | null;
  /** Suggested destination location derived from the student slot. */
  ubicacionDestinoSugerida: {
    id: string;
    nombre: string;
  } | null;
  /** All storage locations associated with the user. */
  ubicacionesUsuario: Array<{
    id: string;
    nombre: string;
  }>;
  /** Product lines available for distribution. */
  lineas: DistribucionDisponibleLinea[];
}

/**
 * A single product line within a created distribution record.
 */
export interface DistribucionLinea {
  /** Unique identifier. */
  id: string;
  /** Identifier of the originating pedido-usuario line. */
  pedidoUsuarioLineaId: string;
  /** Identifier of the product-supplier relation. */
  productoProveedorId: string;
  /** Quantity originally ordered. */
  cantidadPedida: number;
  /** Quantity attributed from the reception. */
  cantidadRecepcionadaAtribuida: number;
  /** Quantity already distributed prior to this record. */
  cantidadYaDistribuida: number;
  /** Quantity planned for distribution in this record. */
  cantidadADistribuir: number;
  /** Quantity actually delivered. */
  cantidadEntregada: number;
  /** Line status (e.g. 'pendiente', 'entregado'). */
  estado: string;
  /** Optional observations for this line. */
  observaciones?: string;
  /** Optional populated product-supplier relation. */
  productoProveedor?: {
    id: string;
    producto?: {
      id: string;
      nombre: string;
    };
  };
}

/**
 * Represents a distribution (entrega) record as returned by the API.
 */
export interface Distribucion {
  /** Unique identifier. */
  id: string;
  /** Identifier of the pedido-usuario being distributed. */
  pedidoUsuarioId: string;
  /** Current status (e.g. 'preparacion', 'entregado', 'cancelado'). */
  estado: string;
  /** ISO timestamp when distribution preparation started. */
  fechaPreparacion: string;
  /** ISO timestamp when the delivery was completed. */
  fechaEntrega?: string;
  /** Optional free-text observations. */
  observaciones?: string;
  /** Reason provided when the distribution was cancelled. */
  motivoCancelacion?: string;
  /** Optional populated pedido-usuario relation. */
  pedidoUsuario?: {
    id: string;
    numeroGlobal: string;
    estado: string;
    usuario?: {
      id?: string;
      nombre?: string;
      username?: string;
    };
  };
  /** Storage location from which the items are dispatched. */
  ubicacionOrigen?: {
    id: string;
    nombre: string;
  };
  /** Storage location where the items are delivered. */
  ubicacionDestino?: {
    id: string;
    nombre: string;
  };
  /** Classroom slot receiving the delivery, if applicable. */
  alumnoSlot?: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacion?: {
      id: string;
      nombre: string;
    };
  };
  /** Individual product lines included in the distribution. */
  lineas?: DistribucionLinea[];
}

/**
 * Payload for creating a new distribution record.
 */
export interface CreateDistribucionPayload {
  /** Identifier of the pedido-usuario to distribute. */
  pedidoUsuarioId: string;
  /** Optional source location identifier. */
  ubicacionOrigenId?: string;
  /** Optional destination location identifier. */
  ubicacionDestinoId?: string;
  /** Optional classroom slot identifier. */
  alumnoSlotId?: string;
  /** Optional free-text observations. */
  observaciones?: string;
  /** Product lines with their quantities to distribute. */
  lineas: Array<{
    pedidoUsuarioLineaId: string;
    cantidad: number;
    observaciones?: string;
  }>;
}
