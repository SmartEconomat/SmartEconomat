export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  modulo: string;
  accion: string;
}

export interface Usuario {
  id: string | number;
  username: string;
  email: string;
  rol: string;
  estado: string;
  fecha_registro?: string;
  roleId?: string;
  roleName?: string;
  permisosAdicionales?: Permiso[];
  permisosExcluidos?: Permiso[];
}

export interface RolOption {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos?: Permiso[];
}

export type CrearUsuarioDTO = Omit<
  Usuario,
  'id' | 'fecha_registro' | 'permisosAdicionales' | 'permisosExcluidos'
>;

export interface ActualizarUsuarioDTO extends Partial<CrearUsuarioDTO> {
  roleId?: string;
  permisosAdicionalesIds?: string[];
  permisosExcluidosIds?: string[];
}

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
