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

export interface IncidenciaLinea {
  id: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  diferencia: number;
  tipoDiferencia: TipoDiferencia;
  estadoReclamacion: EstadoReclamacion;
  observaciones?: string;
  pedidoProductoId: string;
  nombreProducto: string;
}

export interface Incidencia {
  id: string;
  recepcionId: string;
  pedidoId: string;
  proveedorNombre: string;
  observacionesRecepcion?: string;
  observacionesResolucion?: string;
  resuelta: boolean;
  fechaResolucion?: string;
  lineas: IncidenciaLinea[];
  createdAt: string;
}

export interface IncidenciasQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  resuelta?: boolean;
  startDate?: string;
  endDate?: string;
}
