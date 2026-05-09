/** Catálogo de valores enumerados (EstadoPedido) dentro de smart-economat-frontend (SPA). */
export enum EstadoPedido {
  PENDIENTE_DE_APROBACION = 'pendiente_de_aprobacion',
  POR_RECEPCIONAR = 'por_recepcionar',
  RECEPCIONADO = 'recepcionado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
  PARCIAL = 'parcial',
}

/** Catálogo de valores enumerados (EstadoPedidoUsuario) dentro de smart-economat-frontend (SPA). */
export enum EstadoPedidoUsuario {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  CONSOLIDADO = 'consolidado',
  CANCELADO = 'cancelado',
}

/**
 * Expone "isPendingPedidoUsuarioStatus" en smart-economat-frontend (SPA).
 * @undefined {string | undefined} estado - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isPendingPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.PENDIENTE;

/**
 * Expone "isActivePedidoUsuarioStatus" en smart-economat-frontend (SPA).
 * @undefined {string | undefined} estado - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isActivePedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.APROBADO;

/**
 * Expone "isFinishedPedidoUsuarioStatus" en smart-economat-frontend (SPA).
 * @undefined {string | undefined} estado - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isFinishedPedidoUsuarioStatus = (estado?: string): boolean =>
  estado === EstadoPedidoUsuario.CANCELADO ||
  estado === EstadoPedidoUsuario.CONSOLIDADO;

/** Catálogo de valores enumerados (EstadoLote) dentro de smart-economat-frontend (SPA). */
export enum EstadoLote {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COMPLETADO = 'completado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
}

/** Alias público (PedidoEntityType) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidoEntityType = 'pedido' | 'pedido_usuario' | 'purchase_batch';
/** Alias público (PedidoDetailEntityType) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidoDetailEntityType = Exclude<PedidoEntityType, 'pedido'>;

/** Contrato de tipos público (UsuarioBasico). Contexto: smart-economat-frontend (SPA). */
export interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
  username?: string;
}

/** Contrato de tipos público (PedidoProducto). Contexto: smart-economat-frontend (SPA). */
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
    effectiveBarcode?: string;
    proveedor: {
      id: string;
      nombre: string;
    };
  };
}

/** Contrato de tipos público (PedidoVisibleRef). Contexto: smart-economat-frontend (SPA). */
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

/** Contrato de tipos público (Pedido). Contexto: smart-economat-frontend (SPA). */
export interface Pedido extends PedidoBase<EstadoPedido> {
  entityType?: 'pedido';
  pedidoUsuarioId?: string;
  pedidoUsuario?: PedidoVisibleRef;
  numeroGlobal?: string;
  numeroPedidoProveedor?: string;
  numeroPedidoVisible?: string;
  referenciaPedidoVisible?: string;
  proveedor?: {
    id: string;
    nombre: string;
  };
  pedidoProductos?: PedidoProducto[];
  batchId?: string;
  batch?: PurchaseBatch;
}

/** Contrato de tipos público (PedidoUsuarioLinea). Contexto: smart-economat-frontend (SPA). */
export interface PedidoUsuarioLinea {
  id: string;
  productoProveedorId?: string;
  cantidad: number;
  precioUnitario: number;
  observaciones?: string;
  productoProveedor?: PedidoProducto['productoProveedor'];
}

/** Contrato de tipos público (PedidoUsuario). Contexto: smart-economat-frontend (SPA). */
export interface PedidoUsuario extends PedidoBase<EstadoPedidoUsuario> {
  entityType?: 'pedido_usuario';
  numeroGlobal: string;
  lineas?: PedidoUsuarioLinea[];
  pedidos?: Pedido[];
}

/** Contrato de tipos público (PedidoUsuarioRow). Contexto: smart-economat-frontend (SPA). */
export interface PedidoUsuarioRow extends PedidoUsuario {
  entityType: 'pedido_usuario';
  pedidoUsuarioId: string;
  proveedor: {
    id: string;
    nombre: string;
  };
  pedidoProductos: PedidoProducto[];
}

/** Contrato de tipos público (PurchaseBatch). Contexto: smart-economat-frontend (SPA). */
export interface PurchaseBatch {
  entityType?: 'purchase_batch';
  id: string;
  numeroGlobal?: string;
  referencia?: string;
  numeroLote?: string;
  referenciaLote?: string;
  createdAt: string;
  estado: EstadoLote;
  observaciones?: string;
  usuario?: UsuarioBasico;
  pedidos?: Pedido[];
}

/** Alias público (PedidoListItem) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidoListItem = Pedido | PedidoUsuarioRow;

/** Alias público (PedidoBatchDetail) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidoBatchDetail =
  | {
      entityType: 'pedido_usuario';
      data: PedidoUsuario;
    }
  | {
      entityType: 'purchase_batch';
      data: PurchaseBatch;
    };
