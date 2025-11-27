import { EstadoPedido } from '../enums/estado-pedido.enum';

export interface IPedido {
  id: string;
  fechaEntrega: Date;
  costeTotal: number;
  estado: EstadoPedido;
}
