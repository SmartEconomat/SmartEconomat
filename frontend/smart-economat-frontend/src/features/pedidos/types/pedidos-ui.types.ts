import {
  PedidoEntityType,
  PedidoListItem,
  PurchaseBatch,
} from '../../../services/pedido.types';

export type PedidosTabValue = 0 | 1 | 2;

export type MisPedidosStatusFilter = 'pendientes' | 'activos' | 'finalizados';

export type PedidosViewMode = 'list' | 'grid';

export interface PedidoFormValues extends Record<string, unknown> {
  id?: string;
  batchId?: string;
  targetType?: PedidoEntityType;
  numeroGlobal?: string;
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
  canConsolidate: boolean;
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
  onView: (pedido: PedidoListItem) => void;
  onEdit: (pedido: PedidoListItem) => void;
  onDelete: (pedido: PedidoListItem) => void;
  onApprove: (pedido: PedidoListItem) => void;
  onCancel: (pedido: PedidoListItem) => void;
  onViewDelivery: (pedido: PedidoListItem) => void;
}

export interface PurchaseBatchActionHandlers {
  onView: (batch: PurchaseBatch) => void;
  onRecepcion: (batch: PurchaseBatch) => void;
  onTramitar: (batch: PurchaseBatch) => void;
  onDistribucion?: (batch: PurchaseBatch) => void;
}
