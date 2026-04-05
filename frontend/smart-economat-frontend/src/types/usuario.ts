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
  nombre?: string | null;
  email: string;
  rol: string;
  estado: string;
  fecha_registro?: string;
  roleId?: string;
  roleName?: string;
  permisosAdicionales?: Permiso[];
  permisosExcluidos?: Permiso[];
  slotId?: string | null;
  ubicacionId?: string | null;
}

export interface RolOption {
  id: string;
  nombre: string;
  descripcion?: string;
  plantillaRolId?: string | null;
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
  slotId?: string | null;
  ubicacionId?: string | null;
}

export interface ApiResponse<T> {
  success?: boolean;
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
