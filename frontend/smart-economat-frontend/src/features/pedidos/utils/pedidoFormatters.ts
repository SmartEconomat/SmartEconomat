import { PedidoListItem, PurchaseBatch } from '../../../services/pedido.types';
import {
  formatLocalizedCurrencyEUR,
  formatLocalizedDate,
  formatLocalizedDateTime,
} from '../../../utils/intlFormat';

export type PedidoNumberContext =
  | 'auto'
  | 'pedido-proveedor'
  | 'pedido-visible';

/**
 * Documentación en español.
 */
export const formatPedidoDate = (
  value?: string,
  format: 'date' | 'datetime' = 'date'
): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return format === 'datetime'
    ? formatLocalizedDateTime(d)
    : formatLocalizedDate(d);
};

/**
 * Documentación en español.
 */
export const formatCurrency = (value?: number | string | null): string =>
  formatLocalizedCurrencyEUR(value);

/**
 * Documentación en español.
 */
export const formatPedidoId = (id?: string): string => {
  if (!id) return '—';
  return id.split('-')[0] || id;
};

const resolvePedidoProveedorNumber = (pedido: {
  numeroPedidoProveedor?: string | number;
  numeroGlobal?: string | number;
}): string | undefined => {
  const numeroProveedor = pedido.numeroPedidoProveedor || pedido.numeroGlobal;
  return numeroProveedor ? String(numeroProveedor) : undefined;
};

const resolvePedidoVisibleNumber = (pedido: {
  numeroPedidoVisible?: string | number;
  pedidoUsuario?: {
    numeroGlobal?: string | number;
  };
}): string | undefined => {
  const numeroVisible =
    pedido.numeroPedidoVisible || pedido.pedidoUsuario?.numeroGlobal;
  return numeroVisible ? String(numeroVisible) : undefined;
};

/**
 * Documentación en español.
 */
export const formatPedidoListNumber = (
  pedido: Pick<PedidoListItem, 'id' | 'numeroGlobal'> & {
    entityType?: string;
    numeroPedidoProveedor?: string | number;
    numeroPedidoVisible?: string | number;
    pedidoUsuario?: {
      numeroGlobal?: string | number;
    };
    batchId?: string;
    batch?: {
      id?: string;
    };
  },
  context: PedidoNumberContext = 'auto'
): string => {
  const numeroProveedor = resolvePedidoProveedorNumber(pedido);
  const numeroVisible = resolvePedidoVisibleNumber(pedido);

  if (context === 'pedido-proveedor' && numeroProveedor) {
    return numeroProveedor;
  }

  if (context === 'pedido-visible' && numeroVisible) {
    return numeroVisible;
  }

  if (
    context === 'auto' &&
    pedido.entityType === 'pedido_usuario' &&
    numeroVisible
  ) {
    return numeroVisible;
  }

  if (numeroProveedor) {
    return numeroProveedor;
  }

  if (numeroVisible) {
    return numeroVisible;
  }

  if (pedido.batchId) {
    return formatPedidoId(pedido.batchId);
  }

  if (pedido.batch?.id) {
    return formatPedidoId(pedido.batch.id);
  }

  return formatPedidoId(pedido.id);
};

/**
 * Documentación en español.
 */
export const formatBatchNumber = (batch: PurchaseBatch): string => {
  const numeroLote = batch.numeroLote || batch.numeroGlobal;
  return numeroLote ? String(numeroLote) : formatPedidoId(batch.id);
};

/**
 * Documentación en español.
 */
export const formatBatchReference = (batch: PurchaseBatch): string => {
  if (batch.referenciaLote) {
    return batch.referenciaLote;
  }

  if (batch.referencia) {
    return batch.referencia;
  }

  const numeroLote = batch.numeroLote || batch.numeroGlobal;
  if (numeroLote) {
    return `LC-${String(numeroLote).padStart(6, '0')}`;
  }

  return formatPedidoId(batch.id);
};

/**
 * Documentación en español.
 */
export const getPedidoCreatorName = (
  pedido: Pick<PedidoListItem, 'usuario'>
): string => pedido.usuario?.nombre || pedido.usuario?.username || '—';

/**
 * Documentación en español.
 */
export const getPedidoProviderName = (
  pedido: Pick<PedidoListItem, 'proveedor'>
): string => pedido.proveedor?.nombre || '—';

/**
 * Documentación en español.
 */
export const getBatchProvidersSummary = (batch: PurchaseBatch): string => {
  const uniqueProviders = Array.from(
    new Set(
      batch.pedidos?.map((pedido) => pedido.proveedor?.nombre).filter(Boolean)
    )
  );

  return uniqueProviders.length > 0 ? uniqueProviders.join(', ') : '—';
};

/**
 * Documentación en español.
 */
export const getBatchPedidosCount = (batch: PurchaseBatch): number => {
  return (batch.pedidos || []).length;
};

/**
 * Documentación en español.
 */
export const getBatchTotal = (batch: PurchaseBatch): number =>
  batch.pedidos?.reduce(
    (sum, pedido) => sum + Number(pedido.costeTotal || 0),
    0
  ) || 0;
