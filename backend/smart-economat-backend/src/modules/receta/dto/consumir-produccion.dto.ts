import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export enum TipoConsumoProduccion {
  RACIONES = 'raciones',
  CANTIDAD = 'cantidad',
}

export class ConsumirProduccionDto {
  @ApiProperty({
    enum: TipoConsumoProduccion,
    description:
      'Indica si el consumo se expresa en raciones o en cantidad total',
    example: TipoConsumoProduccion.RACIONES,
  })
  @IsEnum(TipoConsumoProduccion)
  tipo!: TipoConsumoProduccion;

  @ApiProperty({
    description: 'Valor a consumir en función del tipo seleccionado',
    example: 2,
  })
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @IsPositive()
  valor!: number;
}
