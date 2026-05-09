import {
  PedidoEntityType,
  PedidoListItem,
  PurchaseBatch,
} from '../../../services/pedido.types';

/** Alias público (PedidosTabValue) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidosTabValue = 0 | 1 | 2;

/** Alias público (MisPedidosStatusFilter) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type MisPedidosStatusFilter = 'pendientes' | 'activos' | 'finalizados';

/** Alias público (PedidosViewMode) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidosViewMode = 'list' | 'grid';

/** Contrato de tipos público (PedidoFormValues). Contexto: smart-economat-frontend (SPA). */
export interface PedidoFormValues extends Record<string, unknown> {
  id?: string;
  batchId?: string;
  targetType?: PedidoEntityType;
  numeroGlobal?: string;
  proveedorId?: string;
  observaciones?: string;
  pedidoProductos?: unknown[];
  estado?: string;
}

/** Contrato de tipos público (PedidoPermissions). Contexto: smart-economat-frontend (SPA). */
export interface PedidoPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCancel: boolean;
  canApprove: boolean;
}

/** Contrato de tipos público (PedidosPaginationState). Contexto: smart-economat-frontend (SPA). */
export interface PedidosPaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/** Contrato de tipos público (PedidosFiltersState). Contexto: smart-economat-frontend (SPA). */
export interface PedidosFiltersState {
  searchTerm: string;
  viewMode: PedidosViewMode;
  tabIndex: PedidosTabValue;
}

/** Contrato de tipos público (PedidoActionHandlers). Contexto: smart-economat-frontend (SPA). */
export interface PedidoActionHandlers {
  onView: (pedido: PedidoListItem) => void;
  onEdit: (pedido: PedidoListItem) => void;
  onDelete: (pedido: PedidoListItem) => void;
  onApprove: (pedido: PedidoListItem) => void;
  onCancel: (pedido: PedidoListItem) => void;
  onViewDelivery: (pedido: PedidoListItem) => void;
}

/** Contrato de tipos público (PurchaseBatchActionHandlers). Contexto: smart-economat-frontend (SPA). */
export interface PurchaseBatchActionHandlers {
  onView: (batch: PurchaseBatch) => void;
  onRecepcion: (batch: PurchaseBatch) => void;
}
