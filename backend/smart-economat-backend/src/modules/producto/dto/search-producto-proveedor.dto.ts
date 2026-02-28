import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductoProveedorDto {
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El término de búsqueda no puede exceder los 100 caracteres',
  })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El offset debe ser un entero' })
  @Min(0, { message: 'El offset no puede ser negativo' })
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(50, { message: 'El límite no puede exceder 50' })
  limit?: number = 20;
}
