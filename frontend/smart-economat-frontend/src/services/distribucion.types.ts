export interface DistribucionDisponibleLinea {
  pedidoUsuarioLineaId: string;
  productoProveedorId: string;
  productoNombre: string;
  cantidadPedida: number;
  cantidadRecepcionada: number;
  cantidadDistribuida: number;
  cantidadPendiente: number;
}

export interface DistribucionDisponible {
  pedidoUsuarioId: string;
  numeroGlobal: string;
  estado: string;
  usuario: {
    id?: string;
    nombre?: string;
    username?: string;
  } | null;
  alumnoSlot: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacionId?: string;
    ubicacionNombre?: string;
  } | null;
  ubicacionDestinoSugerida: {
    id: string;
    nombre: string;
  } | null;
  ubicacionesUsuario: Array<{
    id: string;
    nombre: string;
  }>;
  lineas: DistribucionDisponibleLinea[];
}

export interface DistribucionLinea {
  id: string;
  pedidoUsuarioLineaId: string;
  productoProveedorId: string;
  cantidadPedida: number;
  cantidadRecepcionadaAtribuida: number;
  cantidadYaDistribuida: number;
  cantidadADistribuir: number;
  cantidadEntregada: number;
  estado: string;
  observaciones?: string;
  productoProveedor?: {
    id: string;
    producto?: {
      id: string;
      nombre: string;
    };
  };
}

export interface Distribucion {
  id: string;
  pedidoUsuarioId: string;
  estado: string;
  fechaPreparacion: string;
  fechaEntrega?: string;
  observaciones?: string;
  motivoCancelacion?: string;
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
  ubicacionOrigen?: {
    id: string;
    nombre: string;
  };
  ubicacionDestino?: {
    id: string;
    nombre: string;
  };
  alumnoSlot?: {
    id: string;
    aula: string;
    numeroClase: number;
    ubicacion?: {
      id: string;
      nombre: string;
    };
  };
  lineas?: DistribucionLinea[];
}

export interface CreateDistribucionPayload {
  pedidoUsuarioId: string;
  ubicacionOrigenId?: string;
  ubicacionDestinoId?: string;
  alumnoSlotId?: string;
  observaciones?: string;
  lineas: Array<{
    pedidoUsuarioLineaId: string;
    cantidad: number;
    observaciones?: string;
  }>;
}
