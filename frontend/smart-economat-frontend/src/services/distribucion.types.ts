/**
 * Documentación en español.
 */
export interface DistribucionDisponibleLinea {
        /**
     * Documentación en español.
     */
  pedidoUsuarioLineaId: string;
        /**
     * Documentación en español.
     */
  productoProveedorId: string;
        /**
     * Documentación en español.
     */
  productoNombre: string;
        /**
     * Documentación en español.
     */
  cantidadPedida: number;
        /**
     * Documentación en español.
     */
  cantidadRecepcionada: number;
        /**
     * Documentación en español.
     */
  cantidadDistribuida: number;
        /**
     * Documentación en español.
     */
  cantidadPendiente: number;
}

/**
 * Documentación en español.
 */
export interface DistribucionDisponible {
        /**
     * Documentación en español.
     */
  pedidoUsuarioId: string;
        /**
     * Documentación en español.
     */
  numeroGlobal: string;
        /**
     * Documentación en español.
     */
  estado: string;
        /**
     * Documentación en español.
     */
  usuario: {
    id?: string;
    nombre?: string;
    username?: string;
  } | null;
        /**
     * Documentación en español.
     */
  alumnoSlot: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacionId?: string;
    ubicacionNombre?: string;
  } | null;
        /**
     * Documentación en español.
     */
  ubicacionDestinoSugerida: {
    id: string;
    nombre: string;
  } | null;
        /**
     * Documentación en español.
     */
  ubicacionesUsuario: Array<{
    id: string;
    nombre: string;
  }>;
        /**
     * Documentación en español.
     */
  lineas: DistribucionDisponibleLinea[];
}

/**
 * Documentación en español.
 */
export interface DistribucionLinea {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  pedidoUsuarioLineaId: string;
        /**
     * Documentación en español.
     */
  productoProveedorId: string;
        /**
     * Documentación en español.
     */
  cantidadPedida: number;
        /**
     * Documentación en español.
     */
  cantidadRecepcionadaAtribuida: number;
        /**
     * Documentación en español.
     */
  cantidadYaDistribuida: number;
        /**
     * Documentación en español.
     */
  cantidadADistribuir: number;
        /**
     * Documentación en español.
     */
  cantidadEntregada: number;
        /**
     * Documentación en español.
     */
  estado: string;
        /**
     * Documentación en español.
     */
  observaciones?: string;
        /**
     * Documentación en español.
     */
  productoProveedor?: {
    id: string;
    producto?: {
      id: string;
      nombre: string;
    };
  };
}

/**
 * Documentación en español.
 */
export interface Distribucion {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  pedidoUsuarioId: string;
        /**
     * Documentación en español.
     */
  estado: string;
        /**
     * Documentación en español.
     */
  fechaPreparacion: string;
        /**
     * Documentación en español.
     */
  fechaEntrega?: string;
        /**
     * Documentación en español.
     */
  observaciones?: string;
        /**
     * Documentación en español.
     */
  motivoCancelacion?: string;
        /**
     * Documentación en español.
     */
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
        /**
     * Documentación en español.
     */
  ubicacionOrigen?: {
    id: string;
    nombre: string;
  };
        /**
     * Documentación en español.
     */
  ubicacionDestino?: {
    id: string;
    nombre: string;
  };
        /**
     * Documentación en español.
     */
  alumnoSlot?: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacion?: {
      id: string;
      nombre: string;
    };
  };
        /**
     * Documentación en español.
     */
  lineas?: DistribucionLinea[];
}

/**
 * Documentación en español.
 */
export interface CreateDistribucionPayload {
        /**
     * Documentación en español.
     */
  pedidoUsuarioId: string;
        /**
     * Documentación en español.
     */
  ubicacionOrigenId?: string;
        /**
     * Documentación en español.
     */
  ubicacionDestinoId?: string;
        /**
     * Documentación en español.
     */
  alumnoSlotId?: string;
        /**
     * Documentación en español.
     */
  observaciones?: string;
        /**
     * Documentación en español.
     */
  lineas: Array<{
    pedidoUsuarioLineaId: string;
    cantidad: number;
    observaciones?: string;
  }>;
}
