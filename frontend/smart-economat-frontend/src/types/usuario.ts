/** Contrato de tipos público (Permiso). Contexto: smart-economat-frontend (SPA). */
export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  modulo: string;
  accion: string;
}

/** Contrato de tipos público (Usuario). Contexto: smart-economat-frontend (SPA). */
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
  ubicacionesIds?: string[];
  ubicaciones?: Array<{ id: string; nombre: string }>;
  preferences?: Record<string, unknown>;
}

/** Contrato de tipos público (RolOption). Contexto: smart-economat-frontend (SPA). */
export interface RolOption {
  id: string;
  nombre: string;
  descripcion?: string;
  plantillaRolId?: string | null;
  permisos?: Permiso[];
}

/** Alias público (CrearUsuarioDTO) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type CrearUsuarioDTO = Omit<
  Usuario,
  'id' | 'fecha_registro' | 'permisosAdicionales' | 'permisosExcluidos'
>;

/** Contrato de tipos público (ActualizarUsuarioDTO). Contexto: smart-economat-frontend (SPA). */
export interface ActualizarUsuarioDTO extends Partial<CrearUsuarioDTO> {
  roleId?: string;
  permisosAdicionalesIds?: string[];
  permisosExcluidosIds?: string[];
  slotId?: string | null;
  ubicacionId?: string | null;
}

/** Contrato de tipos público (ApiResponse). Contexto: smart-economat-frontend (SPA). */
export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
  status: number;
}

/** Contrato de tipos público (PaginatedResponse). Contexto: smart-economat-frontend (SPA). */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
