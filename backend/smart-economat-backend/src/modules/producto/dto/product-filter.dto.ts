import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { Alergeno, TipoProducto } from '../enums/producto.enums';

/** Normaliza query params booleanos (`true` / `false` / boolean). */
export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function commaOrArrayToStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return [];
}

/** Clase pública (ProductFilterDto). Paquete: smart-economat-backend (Nest). */
export class ProductFilterDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => parseOptionalBoolean(value))
  minStock?: boolean;

  /**
   * Listado «papelera»: solo registros con soft-delete (`deleted_at` no nulo).
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => parseOptionalBoolean(value))
  soloEliminados?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(Alergeno, { each: true })
  @Transform(({ value }) => commaOrArrayToStrings(value))
  alergenos?: Alergeno[];

  @IsOptional()
  @IsArray()
  @IsEnum(TipoProducto, { each: true })
  @Transform(({ value }) => commaOrArrayToStrings(value))
  categorias?: TipoProducto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => commaOrArrayToStrings(value))
  marcas?: string[];
}
