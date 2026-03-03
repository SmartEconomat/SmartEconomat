import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DificultadReceta, TiempoReceta } from '../enums/receta.enums';
import { AddIngredienteDto } from './add-ingrediente.dto';

export class CreateRecetaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
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
  @MaxLength(50)
  tiempoPreparacion!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddIngredienteDto)
  ingredientes!: AddIngredienteDto[];
}
