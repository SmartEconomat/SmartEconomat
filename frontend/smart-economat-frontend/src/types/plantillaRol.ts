import type { Permiso } from './usuario';

export interface PlantillaRol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  esEditable: boolean;
  activo: boolean;
  plantillaPadreId?: string | null;
  permisos: Permiso[];
}

export interface CreatePlantillaRolDto {
  nombre: string;
  descripcion?: string;
  plantillaPadreId?: string;
  permisoIds?: string[];
}

export interface UpdatePlantillaRolDto {
  nombre?: string;
  descripcion?: string;
  plantillaPadreId?: string;
  permisoIds?: string[];
}
