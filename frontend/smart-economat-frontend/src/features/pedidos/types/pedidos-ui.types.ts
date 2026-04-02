import { Pedido, PurchaseBatch } from '../../../services/pedido.types';

export type PedidosTabValue = 0 | 1 | 2;

export type MisPedidosStatusFilter =
  | 'pendientes'
  | 'en_proceso'
  | 'finalizados';

export type PedidosViewMode = 'list' | 'grid';

export interface PedidoFormValues extends Record<string, unknown> {
  id?: string;
  batchId?: string;
  isBatchAggregate?: boolean;
  aggregateType?: 'pedido_usuario';
  numeroGlobal?: string | number;
  proveedorId?: string;
  observaciones?: string;
  pedidoProductos?: unknown[];
  estado?: string;
  usuarioSolicitante?: string;
  fechaPedido?: string;
}

export interface PedidoPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCancel: boolean;
  canApprove: boolean;
  canRestore: boolean;
}

export interface PedidosPaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface PedidosFiltersState {
  searchTerm: string;
  viewMode: PedidosViewMode;
  tabIndex: PedidosTabValue;
}

export interface PedidoActionHandlers {
  onView: (pedido: Pedido) => void;
  onEdit: (pedido: Pedido) => void;
  onDelete: (pedido: Pedido) => void;
  onApprove: (pedido: Pedido) => void;
  onCancel: (pedido: Pedido) => void;
  onRestore: (pedido: Pedido) => void;
  onViewDelivery: (pedido: Pedido) => void;
  onConfirmReceipt: (pedido: Pedido) => void;
}

export interface PurchaseBatchActionHandlers {
  onView: (batch: PurchaseBatch) => void;
  onRecepcion: (batch: PurchaseBatch) => void;
  onTramitar: (batch: PurchaseBatch) => void;
  onDistribucion?: (batch: PurchaseBatch) => void;
}
