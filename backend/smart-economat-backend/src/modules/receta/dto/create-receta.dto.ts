import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DificultadReceta, UnidadIngrediente } from '../enums/receta.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { IsPortion } from '../../../common/decorators/is-portion.decorator';
import { AddIngredienteDto } from './add-ingrediente.dto';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

/** Clase pública (CreateRecetaDto). Paquete: smart-economat-backend (Nest). */
export class CreateRecetaDto {
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @IsNotEmpty()
  instrucciones!: string;

  @IsInt()
  @Min(10)
  tiempoEstimadoMinutos!: number;

  @IsEnum(DificultadReceta)
  dificultad!: DificultadReceta;

  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_PRODUCIDA_POR_DEFECTO_RENDIMIEN',
  })
  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
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

  @IsOptional()
  @IsString()
  pathImg?: string;

  @IsOptional()
  @IsString()
  pathImgOptimized?: string;

  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsPortion()
  raciones?: number;

  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  tamanioRacion?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddIngredienteDto)
  ingredientes!: AddIngredienteDto[];
}
