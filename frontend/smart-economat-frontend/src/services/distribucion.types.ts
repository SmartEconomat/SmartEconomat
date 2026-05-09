/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface DistribucionDisponibleLinea {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoUsuarioLineaId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  productoProveedorId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  productoNombre: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPedida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadRecepcionada: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadDistribuida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPendiente: number;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface DistribucionDisponible {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoUsuarioId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  numeroGlobal: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estado: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  usuario: {
    id?: string;
    nombre?: string;
    username?: string;
  } | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  alumnoSlot: {
    id: string;
    aula: string;
    numeroClase: number;
  } | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionDestinoSugerida: {
    id: string;
    nombre: string;
  } | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionesUsuario: Array<{
    id: string;
    nombre: string;
  }>;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  lineas: DistribucionDisponibleLinea[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface DistribucionLinea {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoUsuarioLineaId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  productoProveedorId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadPedida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadRecepcionadaAtribuida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadYaDistribuida: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadADistribuir: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  cantidadEntregada: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estado: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface Distribucion {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoUsuarioId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  estado: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  fechaPreparacion: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  fechaEntrega?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  motivoCancelacion?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionOrigen?: {
    id: string;
    nombre: string;
  };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionDestino?: {
    id: string;
    nombre: string;
  };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  alumnoSlot?: {
    id: string;
    aula: string;
    numeroClase: number;
  };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  lineas?: DistribucionLinea[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface CreateDistribucionPayload {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  pedidoUsuarioId: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionOrigenId?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  ubicacionDestinoId?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  alumnoSlotId?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  observaciones?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  lineas: Array<{
    pedidoUsuarioLineaId: string;
    cantidad: number;
    observaciones?: string;
  }>;
}
