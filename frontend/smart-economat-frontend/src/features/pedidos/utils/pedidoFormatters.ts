import dayjs from 'dayjs';
import { PedidoListItem, PurchaseBatch } from '../../../services/pedido.types';

export type PedidoNumberContext =
  | 'auto'
  | 'pedido-proveedor'
  | 'pedido-visible';

/**
 * @description Formats a date string for display in the pedidos UI.
 * @param value - ISO date string to format; returns '—' if absent or invalid
 * @param format - 'date' renders DD/MM/YYYY; 'datetime' appends HH:mm
 * @returns Formatted date string or '—' when the value is missing/invalid
 */
export const formatPedidoDate = (
  value?: string,
  format: 'date' | 'datetime' = 'date'
): string => {
  if (!value || !dayjs(value).isValid()) return '—';
  return dayjs(value).format(
    format === 'datetime' ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY'
  );
};

/**
 * @description Formats a numeric or string value as a Spanish-locale Euro currency string.
 * @param value - Numeric or string amount; defaults to 0 when absent
 * @returns Locale-formatted string ending with ' €' (e.g. '1.234,56 €')
 */
export const formatCurrency = (value?: number | string | null): string => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
};

/**
 * @description Returns a short display identifier from a full UUID by taking the first segment.
 * @param id - Full UUID string; returns '—' when absent
 * @returns First UUID segment (before the first '-'), or the full id if no dash is present
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
 * @description Resolves the most appropriate human-readable number to display for a pedido row.
 * Priority order depends on the context: 'pedido-proveedor', 'pedido-visible', or 'auto'.
 * Falls back through various number fields to the short UUID when nothing else is available.
 * @param pedido - Partial pedido row that may carry different number fields
 * @param context - Strategy for number resolution; defaults to 'auto'
 * @returns The best available display number string
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
 * @description Formats the sequential number for a purchase batch.
 * @param batch - PurchaseBatch object with optional numeroLote / numeroGlobal fields
 * @returns Numeric string or a short UUID fallback when no number is available
 */
export const formatBatchNumber = (batch: PurchaseBatch): string => {
  const numeroLote = batch.numeroLote || batch.numeroGlobal;
  return numeroLote ? String(numeroLote) : formatPedidoId(batch.id);
};

/**
 * @description Returns the human-readable reference for a purchase batch.
 * Prefers explicit reference fields and generates a zero-padded 'LC-XXXXXX' code as fallback.
 * @param batch - PurchaseBatch object
 * @returns Reference string for display (e.g. 'LC-000042')
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
 * @description Resolves the display name of the user who created a pedido.
 * @param pedido - Pedido row carrying the nested usuario object
 * @returns Full name or username; '—' when no user information is available
 */
export const getPedidoCreatorName = (
  pedido: Pick<PedidoListItem, 'usuario'>
): string => pedido.usuario?.nombre || pedido.usuario?.username || '—';

/**
 * @description Resolves the display name of the provider associated with a pedido.
 * @param pedido - Pedido row carrying the nested proveedor object
 * @returns Provider name or '—' when absent
 */
export const getPedidoProviderName = (
  pedido: Pick<PedidoListItem, 'proveedor'>
): string => pedido.proveedor?.nombre || '—';

/**
 * @description Builds a comma-separated summary of unique provider names present in a batch.
 * @param batch - PurchaseBatch containing nested pedidos with proveedor data
 * @returns Comma-separated provider names, or '—' when none are found
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
 * @description Returns the total number of pedidos included in a purchase batch.
 * @param batch - PurchaseBatch object
 * @returns Count of nested pedidos (0 when the array is absent)
 */
export const getBatchPedidosCount = (batch: PurchaseBatch): number => {
  return (batch.pedidos || []).length;
};

/**
 * @description Calculates the total estimated cost of all pedidos in a purchase batch.
 * @param batch - PurchaseBatch object with nested pedidos containing costeTotal
 * @returns Sum of all pedido costs as a number (0 when no pedidos are present)
 */
export const getBatchTotal = (batch: PurchaseBatch): number =>
  batch.pedidos?.reduce(
    (sum, pedido) => sum + Number(pedido.costeTotal || 0),
    0
  ) || 0;
