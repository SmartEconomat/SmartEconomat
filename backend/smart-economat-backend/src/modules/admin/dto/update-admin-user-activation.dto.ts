import { IsBoolean, IsOptional } from 'class-validator';

/** Clase pública (UpdateAdminUserActivationDto). Paquete: smart-economat-backend (Nest). */
export class UpdateAdminUserActivationDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
