import dayjs from 'dayjs';
import { Pedido, PurchaseBatch } from '../../../services/pedido.types';

const WEEKLY_BATCH_PREFIX = /^Lote semanal generado desde/i;

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

export const formatPedidoListNumber = (
  pedido: Pick<Pedido, 'id' | 'numeroGlobal'>
): string => {
  if (pedido.numeroGlobal) {
    return String(pedido.numeroGlobal);
  }

  return formatPedidoId(pedido.id);
};

export const getPedidoCreatorName = (pedido: Pedido): string =>
  pedido.usuario?.nombre || pedido.usuario?.username || '—';

export const getPedidoProviderName = (pedido: Pedido): string =>
  pedido.proveedor?.nombre || '—';

export const getBatchProvidersSummary = (batch: PurchaseBatch): string => {
  const uniqueProviders = Array.from(
    new Set(
      batch.pedidos?.map((pedido) => pedido.proveedor?.nombre).filter(Boolean)
    )
  );

  return uniqueProviders.length > 0 ? uniqueProviders.join(', ') : '—';
};

export const getBatchPedidosCount = (batch: PurchaseBatch): number => {
  const pedidos = batch.pedidos || [];

  if (pedidos.length === 0) {
    return 0;
  }

  if (!WEEKLY_BATCH_PREFIX.test(batch.observaciones || '')) {
    return 1;
  }

  return pedidos.length;
};

export const getBatchTotal = (batch: PurchaseBatch): number =>
  batch.pedidos?.reduce(
    (sum, pedido) => sum + Number(pedido.costeTotal || 0),
    0
  ) || 0;
