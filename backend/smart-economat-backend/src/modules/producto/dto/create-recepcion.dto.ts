import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecepcionLineDto {
  @IsString()
  pedidoProductoId: string;

  @IsInt()
  @Min(1)
  cantidadRecibida: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @IsString()
  pedidoId: string;

  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  lineas: RecepcionLineDto[];
}
