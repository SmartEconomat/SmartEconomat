import { IsString } from 'class-validator';

export class CancelPedidoDto {
  @IsString()
  motivoCancelacion: string;
}
