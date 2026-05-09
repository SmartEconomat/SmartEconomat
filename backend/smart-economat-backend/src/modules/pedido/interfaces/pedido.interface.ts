import { EstadoPedido } from '../enums/estado-pedido.enum';

/** Contrato de tipos público (IPedido). Contexto: smart-economat-backend (Nest). */
export interface IPedido {
  id: string;
  fechaEntrega?: Date;
  costeTotal: number;
  estado: EstadoPedido;
  observaciones?: string;
}
