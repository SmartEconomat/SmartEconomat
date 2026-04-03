import { Distribucion } from './distribucion.types';

export enum EstadoPedido {
  PENDIENTE_DE_APROBACION = 'pendiente_de_aprobacion',
  POR_RECEPCIONAR = 'por_recepcionar',
  RECEPCIONADO = 'recepcionado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
  PARCIAL = 'parcial',
}

export enum EstadoPedidoUsuario {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  CANCELADO = 'cancelado',
  CONSOLIDADO = 'consolidado',
}

export const isPendingPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.PENDIENTE;

export const isActivePedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.APROBADO ||
  estado === EstadoPedidoUsuario.CONSOLIDADO;

export const isFinishedPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.CANCELADO;

export enum EstadoLote {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COMPLETADO = 'completado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
}

export type PedidoEntityType = 'pedido' | 'pedido_usuario' | 'purchase_batch';
export type PedidoDetailEntityType = Exclude<PedidoEntityType, 'pedido'>;

export interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
  username?: string;
}

export interface PedidoProducto {
  id: string;
  productoProveedorId: string;
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

export interface PedidoVisibleRef {
  id: string;
  numeroGlobal: string;
  estado: EstadoPedidoUsuario;
  fechaPedido?: string;
  usuario?: UsuarioBasico;
}

interface PedidoBase<TEstado extends string> {
  id: string;
  fechaPedido: string;
  fechaEntrega?: string;
  costeTotal: number;
  estado: TEstado;
  observaciones?: string;
  motivoCancelacion?: string;
  motivoIncidencia?: string;
  usuario?: UsuarioBasico;
}

export interface Pedido extends PedidoBase<EstadoPedido> {
  entityType?: 'pedido';
  pedidoUsuarioId?: string;
  pedidoUsuario?: PedidoVisibleRef;
  numeroGlobal?: string;
  proveedor?: {
    id: string;
    nombre: string;
  };
  pedidoProductos?: PedidoProducto[];
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

export interface PedidoUsuario extends PedidoBase<EstadoPedidoUsuario> {
  entityType?: 'pedido_usuario';
  numeroGlobal: string;
  lineas?: PedidoUsuarioLinea[];
  pedidos?: Pedido[];
}

export interface PedidoUsuarioRow extends PedidoUsuario {
  entityType: 'pedido_usuario';
  pedidoUsuarioId: string;
  proveedor: {
    id: string;
    nombre: string;
  };
  pedidoProductos: PedidoProducto[];
}

export interface PurchaseBatch {
  entityType?: 'purchase_batch';
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

export type PedidoListItem = Pedido | PedidoUsuarioRow;

export type PedidoBatchDetail =
  | {
      entityType: 'pedido_usuario';
      data: PedidoUsuario;
    }
  | {
      entityType: 'purchase_batch';
      data: PurchaseBatch;
    };
