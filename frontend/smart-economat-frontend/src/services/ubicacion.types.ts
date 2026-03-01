export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface CreateUbicacionDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateUbicacionDto extends Partial<CreateUbicacionDto> {}
