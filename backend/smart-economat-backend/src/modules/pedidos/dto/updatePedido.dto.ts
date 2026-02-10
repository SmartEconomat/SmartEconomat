import { IsDateString } from 'class-validator';

export class UpdatePedidoDto {
  @IsDateString()
  fechaEntrega: string;
}
