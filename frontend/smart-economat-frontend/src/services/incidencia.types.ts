export enum TipoDiferencia {
  FALTANTE = 'FALTANTE',
  EXCESO = 'EXCESO',
  DEFECTUOSO = 'DEFECTUOSO',
}

export enum EstadoReclamacion {
  PENDIENTE = 'PENDIENTE',
  RECLAMADO = 'RECLAMADO',
  ABONADO = 'ABONADO',
  REENVIADO = 'REENVIADO',
}

export enum EstadoIncidencia {
  NUEVA = 'nueva',
  EN_AJUSTE = 'en_ajuste',
  PENDIENTE_VALIDACION = 'pendiente_validacion',
  RESUELTA = 'resuelta',
  CANCELADA = 'cancelada',
  INVALIDA = 'invalida',
}

export interface IncidenciaLinea {
  id: string;
  pedidoProductoId: string;
  productoId?: string;
  nombreProducto: string;
  unidad?: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  diferencia: number;
  tipoDiferencia: TipoDiferencia;
  estadoReclamacion: EstadoReclamacion;
  observaciones?: string;
}

export interface Incidencia {
  id: string;
  recepcionId: string;
  pedidoId: string | null;
  proveedorNombre: string;
  motivoIncidencia: string;
  estado: EstadoIncidencia;
  observacionesRecepcion?: string;
  observacionesResolucion?: string;
  resuelta: boolean;
  fechaResolucion?: string;
  cantidadPedidaTotal: number;
  cantidadRecibidaTotal: number;
  cantidadPendienteTotal: number;
  lineas: IncidenciaLinea[];
  createdAt: string;
}

export interface ResolveIncidenciaLineaAdjustment {
  id?: string;
  pedidoProductoId?: string;
  ajusteCantidad?: number;
  cantidadRecibida?: number;
  estadoReclamacion?: EstadoReclamacion;
  observaciones?: string;
}

export interface ResolveIncidenciaPayload {
  usuarioId?: string;
  observacionesResolucion?: string;
  marcarComoResuelta?: boolean;
  estadoFinal?:
    | EstadoIncidencia.RESUELTA
    | EstadoIncidencia.CANCELADA
    | EstadoIncidencia.INVALIDA;
  lineas?: ResolveIncidenciaLineaAdjustment[];
}

export interface IncidenciasQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  resuelta?: boolean;
  startDate?: string;
  endDate?: string;
}
