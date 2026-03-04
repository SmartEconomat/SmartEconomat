import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  Matches,
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
  @Matches(/^\d+ (minutos|horas|segundos)$/, {
    message:
      'El tiempo de preparación debe seguir el formato: "10 minutos", "1 hora", etc.',
  })
  tiempoPreparacion!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddIngredienteDto)
  ingredientes!: AddIngredienteDto[];
}
