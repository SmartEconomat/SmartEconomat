export interface Usuario {
  id: string | number;
  username: string;
  email: string;
  rol: 'Administrador' | 'Profesor' | 'Alumno';
  estado: 'Activo' | 'Inactivo';
  fecha_registro?: string;
}

export type CrearUsuarioDTO = Omit<Usuario, 'id' | 'fecha_registro'>;
export type ActualizarUsuarioDTO = Partial<CrearUsuarioDTO>;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
