/** Contrato de tipos público (Ubicacion). Contexto: smart-economat-frontend (SPA). */
export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
  deletedAt?: string | null;
}

/** Contrato de tipos público (CreateUbicacionDto). Contexto: smart-economat-frontend (SPA). */
export interface CreateUbicacionDto {
  nombre: string;
  descripcion?: string;
}

/** Contrato de tipos público (UbicacionQueryParams). Contexto: smart-economat-frontend (SPA). */
export interface UbicacionQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

/** Alias público (UpdateUbicacionDto) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type UpdateUbicacionDto = Partial<CreateUbicacionDto>;
