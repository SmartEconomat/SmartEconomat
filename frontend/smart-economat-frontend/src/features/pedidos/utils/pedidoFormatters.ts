import { PedidoListItem, PurchaseBatch } from '../../../services/pedido.types';
import {
  formatLocalizedCurrencyEUR,
  formatLocalizedDate,
  formatLocalizedDateTime,
} from '../../../utils/intlFormat';

/** Alias público (PedidoNumberContext) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type PedidoNumberContext =
  | 'auto'
  | 'pedido-proveedor'
  | 'pedido-visible';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "formatPedidoDate" en smart-economat-frontend (SPA).
 * @undefined {string | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {"date" | "datetime"} format - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
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
 * Formatea currency para su presentación.
 *
 * @param value Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export const formatCurrency = (value?: number | string | null): string =>
  formatLocalizedCurrencyEUR(value);

/**
 * Formatea pedido id para su presentación.
 *
 * @param id Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "formatPedidoListNumber" en smart-economat-frontend (SPA).
 * @undefined {Pick<PedidoListItem, "id" | "numeroGlobal"> & { entityType?: string; numeroPedidoProveedor?: string | number; numeroPedidoVisible?: string | number; pedidoUsuario?: { numeroGlobal?: string | number; }; batchId?: string; batch?: { id?: string; }; }} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {PedidoNumberContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
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
 * Formatea batch number para su presentación.
 *
 * @param batch Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export const formatBatchNumber = (batch: PurchaseBatch): string => {
  const numeroLote = batch.numeroLote || batch.numeroGlobal;
  return numeroLote ? String(numeroLote) : formatPedidoId(batch.id);
};

/**
 * Formatea batch reference para su presentación.
 *
 * @param batch Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Pick<PedidoListItem, "usuario">} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const getPedidoCreatorName = (
  pedido: Pick<PedidoListItem, 'usuario'>
): string => pedido.usuario?.nombre || pedido.usuario?.username || '—';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Pick<PedidoListItem, "proveedor">} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const getPedidoProviderName = (
  pedido: Pick<PedidoListItem, 'proveedor'>
): string => pedido.proveedor?.nombre || '—';

/**
 * Obtiene batch providers summary.
 *
 * @param batch Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
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
 * Obtiene batch pedidos count.
 *
 * @param batch Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export const getBatchPedidosCount = (batch: PurchaseBatch): number => {
  return (batch.pedidos || []).length;
};

/**
 * Obtiene batch total.
 *
 * @param batch Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export const getBatchTotal = (batch: PurchaseBatch): number =>
  batch.pedidos?.reduce(
    (sum, pedido) => sum + Number(pedido.costeTotal || 0),
    0
  ) || 0;
