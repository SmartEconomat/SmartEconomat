import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdatePedidoDto {
  @IsDateString(
    {},
    { message: 'La fecha de entrega debe ser una fecha válida (ISO 8601)' }
  )
  @IsNotEmpty({ message: 'La fecha de entrega es obligatoria' })
  fechaEntrega: string;
}
