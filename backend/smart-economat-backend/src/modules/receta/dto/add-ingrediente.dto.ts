import {
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadIngrediente } from '../enums/receta.enums';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class AddIngredienteDto {
  @IsUUID('7')
  productoId!: string;

  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadIngrediente)
  unidad!: UnidadIngrediente;

  @ApiPropertyOptional({
    description: 'docs.PORCENTAJE_DE_MERMA_0_99_EJ_20_20_DE_P_R',
    default: 0,
  })
  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0)
  @Max(99)
  mermaAplicada?: number;

  @ApiPropertyOptional({
    description: 'ID del proveedor favorito para este ingrediente',
  })
  @IsOptional()
  @IsUUID('7')
  proveedorFavoritoId?: string;
}
