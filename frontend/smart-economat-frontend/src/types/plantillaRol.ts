import type { Permiso } from './usuario';

/** Contrato de tipos público (PlantillaRol). Contexto: smart-economat-frontend (SPA). */
export interface PlantillaRol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  esEditable: boolean;
  activo: boolean;
  plantillaPadreId?: string | null;
  permisos: Permiso[];
}

/** Contrato de tipos público (CreatePlantillaRolDto). Contexto: smart-economat-frontend (SPA). */
export interface CreatePlantillaRolDto {
  nombre: string;
  descripcion?: string;
  plantillaPadreId?: string;
  permisoIds?: string[];
}

/** Contrato de tipos público (UpdatePlantillaRolDto). Contexto: smart-economat-frontend (SPA). */
export interface UpdatePlantillaRolDto {
  nombre?: string;
  descripcion?: string;
  plantillaPadreId?: string;
  permisoIds?: string[];
}
