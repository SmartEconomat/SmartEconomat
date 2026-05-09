import {
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AddIngredienteDto } from './add-ingrediente.dto';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

/** Clase pública (RecetaPreviewCostDto). Paquete: smart-economat-backend (Nest). */
export class RecetaPreviewCostDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddIngredienteDto)
  ingredientes!: AddIngredienteDto[];

  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  rendimiento?: number;
}
