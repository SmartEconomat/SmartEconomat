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
    description: 'docs.ID_DEL_PRODUCTO_QUE_RESULTA_DE_LA_ELABOR',
  })
  @IsOptional()
  @IsUUID()
  productoResultadoId?: string;

  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_PRODUCIDA_POR_DEFECTO_RENDIMIEN',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  rendimiento?: number;

  @ApiPropertyOptional({
    enum: UnidadIngrediente,
    description: 'docs.UNIDAD_DEL_PRODUCTO_RESULTANTE',
  })
  @IsOptional()
  @IsEnum(UnidadIngrediente)
  unidadResultado?: UnidadIngrediente;

  @ApiPropertyOptional({
    description: 'docs.D_AS_DE_CADUCIDAD_DEL_PRODUCTO_ELABORADO',
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
