import { EstadoPedido } from '../enums/estado-pedido.enum';

export interface IPedido {
  id: string;
  fecha_entrega: Date;
  coste_total: number;
  estado: EstadoPedido;
}
