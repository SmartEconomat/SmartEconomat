import { Distribucion } from './distribucion.types';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  ENTREGADO = 'entregado',
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
  hasLinkedMovements?: boolean;
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
      contenido?: number;
    };
    proveedor: {
      id: string;
      nombre: string;
    };
  };
}

export interface Pedido {
  id: string;
  pedidoUsuarioId?: string;
  numeroGlobal?: string;
  aggregateType?: 'pedido_usuario';
  fechaPedido: string;
  fechaEntrega?: string;
  costeTotal: number;
  estado: EstadoPedido;
  isAprobado?: boolean;
  observaciones?: string;
  motivoCancelacion?: string;
  motivoIncidencia?: string;
  usuario?: UsuarioBasico;
  proveedor?: {
    id: string;
    nombre: string;
  };
  pedidoProductos?: PedidoProducto[];
  pedidos?: Pedido[];
  distribuciones?: Distribucion[];
  batchId?: string;
  batch?: PurchaseBatch;
  ubicacionEntregaSugeridaId?: string;
  ubicacionEntregaSugerida?: {
    id: string;
    nombre: string;
  };
}

export interface PedidoUsuarioLinea {
  id: string;
  productoProveedorId?: string;
  cantidad: number;
  precioUnitario: number;
  observaciones?: string;
  productoProveedor?: PedidoProducto['productoProveedor'];
}

export interface PedidoUsuario extends Pedido {
  numeroGlobal: string;
  lineas?: PedidoUsuarioLinea[];
  pedidos?: Pedido[];
}

export interface PurchaseBatch {
  id: string;
  createdAt: string;
  estado: EstadoLote;
  isAprobado: boolean;
  observaciones?: string;
  usuario?: UsuarioBasico;
  pedidos?: Pedido[];
  ubicacionEntregaSugeridaId?: string;
  ubicacionEntregaSugerida?: {
    id: string;
    nombre: string;
  };
}
