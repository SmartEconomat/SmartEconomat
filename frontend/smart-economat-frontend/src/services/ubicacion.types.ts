export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface CreateUbicacionDto {
  nombre: string;
  descripcion?: string;
}

export interface UbicacionQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export type UpdateUbicacionDto = Partial<CreateUbicacionDto>;
