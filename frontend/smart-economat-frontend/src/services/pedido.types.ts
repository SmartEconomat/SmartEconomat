export enum EstadoPedido {
    PENDIENTE = 'pendiente',
    EN_PROCESO = 'en_proceso',
    RECIBIDO = 'recibido',
    INCIDENCIA = 'incidencia',
    CANCELADO = 'cancelado',
    PARCIAL = 'parcial',
}

export interface UsuarioBasico {
    id: string;
    nombre: string;
    email: string;
}

export interface Pedido {
    id: string;
    fechaPedido: string;
    fechaEntrega?: string;
    costeTotal: number;
    estado: EstadoPedido;
    motivoCancelacion?: string;
    usuario?: UsuarioBasico;
}
