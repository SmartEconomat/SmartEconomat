export interface DistribucionDisponibleLineaDto {
  pedidoUsuarioLineaId: string;
  productoProveedorId: string;
  productoNombre: string;
  cantidadPedida: number;
  cantidadRecepcionada: number;
  cantidadDistribuida: number;
  cantidadPendiente: number;
}

export interface DistribucionDisponibleDto {
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
  lineas: DistribucionDisponibleLineaDto[];
}
