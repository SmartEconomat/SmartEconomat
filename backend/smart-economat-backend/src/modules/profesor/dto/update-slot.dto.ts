import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Clase pública (UpdateSlotDto). Paquete: smart-economat-backend (Nest). */
export class UpdateSlotDto {
  @IsString()
  @IsOptional()
  aula?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  numeroClase?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacidad?: number;
}
