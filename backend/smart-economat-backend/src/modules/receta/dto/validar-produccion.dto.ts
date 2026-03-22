import {
  IsArray,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ValidarItemDto {
  @IsUUID('7', { message: 'ID de receta inválido' })
  recetaId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser positiva' })
  cantidad!: number;
}

export class ValidarProduccionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidarItemDto)
  items!: ValidarItemDto[];
}
