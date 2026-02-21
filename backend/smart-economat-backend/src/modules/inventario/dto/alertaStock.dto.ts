import { IsUUID, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class AlertaStockDTO {
  @IsUUID('7', { message: 'El ID debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: string;

  @IsNumber({}, { message: 'La cantidad mínima debe ser un número' })
  @Min(0, { message: 'La cantidad mínima no puede ser negativa' })
  cantidadMinima: number;

  @IsNumber({}, { message: 'La cantidad actual debe ser un número' })
  @Min(0, { message: 'La cantidad actual no puede ser negativa' })
  cantidadActual: number;
}
