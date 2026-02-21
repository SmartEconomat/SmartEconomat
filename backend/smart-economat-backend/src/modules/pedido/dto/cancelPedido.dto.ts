import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelPedidoDto {
  @IsString({
    message: 'El motivo de cancelación debe ser una cadena de texto',
  })
  @IsNotEmpty({ message: 'El motivo de cancelación es obligatorio' })
  @MaxLength(1000, {
    message: 'El motivo de cancelación no puede exceder los 1000 caracteres',
  })
  motivoCancelacion: string;
}
