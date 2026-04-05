import dayjs from 'dayjs';
import { PedidoListItem, PurchaseBatch } from '../../../services/pedido.types';

export type PedidoNumberContext =
  | 'auto'
  | 'pedido-proveedor'
  | 'pedido-visible';

export const formatPedidoDate = (
  value?: string,
  format: 'date' | 'datetime' = 'date'
): string => {
  if (!value || !dayjs(value).isValid()) return '—';
  return dayjs(value).format(
    format === 'datetime' ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY'
  );
};

export const formatCurrency = (value?: number | string | null): string => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
};

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

export const formatBatchNumber = (batch: PurchaseBatch): string => {
  const numeroLote = batch.numeroLote || batch.numeroGlobal;
  return numeroLote ? String(numeroLote) : formatPedidoId(batch.id);
};

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

export const getPedidoCreatorName = (
  pedido: Pick<PedidoListItem, 'usuario'>
): string => pedido.usuario?.nombre || pedido.usuario?.username || '—';

export const getPedidoProviderName = (
  pedido: Pick<PedidoListItem, 'proveedor'>
): string => pedido.proveedor?.nombre || '—';

export const getBatchProvidersSummary = (batch: PurchaseBatch): string => {
  const uniqueProviders = Array.from(
    new Set(
      batch.pedidos?.map((pedido) => pedido.proveedor?.nombre).filter(Boolean)
    )
  );

  return uniqueProviders.length > 0 ? uniqueProviders.join(', ') : '—';
};

export const getBatchPedidosCount = (batch: PurchaseBatch): number => {
  return (batch.pedidos || []).length;
};

export const getBatchTotal = (batch: PurchaseBatch): number =>
  batch.pedidos?.reduce(
    (sum, pedido) => sum + Number(pedido.costeTotal || 0),
    0
  ) || 0;
