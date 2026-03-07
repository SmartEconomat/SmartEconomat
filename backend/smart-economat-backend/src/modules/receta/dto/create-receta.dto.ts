import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  Matches,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DificultadReceta,
  TiempoReceta,
  UnidadIngrediente,
} from '../enums/receta.enums';
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

  @ApiPropertyOptional({
    description: 'ID del producto que resulta de la elaboración',
  })
  @IsOptional()
  @IsUUID()
  productoResultadoId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad producida por defecto (rendimiento de la receta)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  rendimiento?: number;

  @ApiPropertyOptional({
    enum: UnidadIngrediente,
    description: 'Unidad del producto resultante',
  })
  @IsOptional()
  @IsEnum(UnidadIngrediente)
  unidadResultado?: UnidadIngrediente;

  @ApiPropertyOptional({
    description: 'Días de caducidad del producto elaborado',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  diasCaducidad?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddIngredienteDto)
  ingredientes!: AddIngredienteDto[];
}
