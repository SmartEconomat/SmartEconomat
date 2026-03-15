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

export interface PedidoProducto {
  id: string;
  id_producto_proveedor?: string;
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
<<<<<<< HEAD
      unidad?: string;
=======
>>>>>>> 2289ced (refactor(pedido): alineación total frontend-backend, tests y UI)
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
<<<<<<< HEAD
=======
  observaciones?: string;
>>>>>>> 2289ced (refactor(pedido): alineación total frontend-backend, tests y UI)
  motivoCancelacion?: string;
  usuario?: UsuarioBasico;
  proveedor?: {
    id: string;
    nombre: string;
  };
  pedidoProductos?: PedidoProducto[];
}
