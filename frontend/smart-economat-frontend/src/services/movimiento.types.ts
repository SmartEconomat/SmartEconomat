export enum TipoMovimiento {
    ENTRADA = 'entrada',
    SALIDA = 'salida',
    AJUSTE = 'ajuste',
    PEDIDO = 'pedido',
    ENTRADA_COMPRA = 'entrada_compra',
}

export interface UsuarioBasico {
    id: string;
    nombre: string;
    email: string;
}

export interface Movimiento {
    id: string;
    tipo: TipoMovimiento;
    cantidad: number;
    entidad: string;
    entidadId: string;
    fecha: string;
    descripcion?: string;
    usuario?: UsuarioBasico;
}
