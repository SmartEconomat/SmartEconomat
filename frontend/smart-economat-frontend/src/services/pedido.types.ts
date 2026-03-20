export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  RECIBIDO = 'recibido',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
  PARCIAL = 'parcial',
}

export enum EstadoLote {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COMPLETADO = 'completado',
}

export interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
  username?: string;
}

export interface PedidoProducto {
  id: string;
  id_producto_proveedor: string;
  productoProveedorId?: string;
  cantidad: number;
  precioUnitario: number;
  observaciones?: string;
  productoProveedor?: {
    id: string;
    precioUnitario: number;
    marca?: string;
    producto: {
      id: string;
      nombre: string;
      codigoBarras?: string;
      unidad?: string;
    };
    proveedor: {
      id: string;
      nombre: string;
    };
  };
}

export interface Pedido {
  id: string;
  fechaPedido: string;
  fechaEntrega?: string;
  costeTotal: number;
  estado: EstadoPedido;
  observaciones?: string;
  motivoCancelacion?: string;
  motivoIncidencia?: string;
  usuario?: UsuarioBasico;
  proveedor?: {
    id: string;
    nombre: string;
  };
  pedidoProductos?: PedidoProducto[];
  batchId?: string;
  batch?: PurchaseBatch;
}

export interface PurchaseBatch {
  id: string;
  createdAt: string;
  estado: EstadoLote;
  observaciones?: string;
  usuario?: UsuarioBasico;
  pedidos?: Pedido[];
}
