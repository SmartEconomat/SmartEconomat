import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

/** Clase pública (CreateAlbaranDto). Paquete: smart-economat-backend (Nest). */
export class CreateAlbaranDto {
  @IsString()
  @IsNotEmpty()
  nAlbaran: string;

  @IsOptional()
  @IsBoolean()
  concordancia?: boolean;

  @IsOptional()
  fecha?: Date;
}
