import { IsOptional, IsString } from 'class-validator';

/** Clase pública (CancelDistribucionDto). Paquete: smart-economat-backend (Nest). */
export class CancelDistribucionDto {
  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
