import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

/** Clase pública (ExportUsuarioFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportUsuarioFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(rolUsuario)
  rol?: rolUsuario;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  activo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
