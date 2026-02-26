import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DificultadReceta,
  TiempoReceta,
  UnidadIngrediente,
} from '../enums/receta.enums';

class CreateRecetaIngredienteDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadIngrediente)
  unidad!: UnidadIngrediente;
}

export class CreateRecetaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  instrucciones!: string;

  @IsEnum(TiempoReceta)
  tiempo!: TiempoReceta;

  @IsEnum(DificultadReceta)
  dificultad!: DificultadReceta;

  @IsString()
  @IsNotEmpty()
  tiempoPreparacion!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecetaIngredienteDto)
  ingredientes!: CreateRecetaIngredienteDto[];
}
