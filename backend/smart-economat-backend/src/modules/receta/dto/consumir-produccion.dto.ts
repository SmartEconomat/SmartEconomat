import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsPositive, ValidateIf } from 'class-validator';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';
import { IsPortion } from '../../../common/decorators/is-portion.decorator';

/** Catálogo de valores enumerados (TipoConsumoProduccion) dentro de smart-economat-backend (Nest). */
export enum TipoConsumoProduccion {
  RACIONES = 'raciones',
  CANTIDAD = 'cantidad',
}

/** Clase pública (ConsumirProduccionDto). Paquete: smart-economat-backend (Nest). */
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
  @ValidateIf(
    (o: ConsumirProduccionDto) => o.tipo === TipoConsumoProduccion.RACIONES
  )
  @IsPortion()
  valor!: number;
}
