import {
  CreatePedidoPayload,
  CreatePurchaseBatchPayload,
  UpdatePedidoPayload,
} from '../../../services/pedido.service';
import { PedidoFormValues } from '../types/pedidos-ui.types';

export interface NormalizedPedidoLine {
  id?: string;
  productoProveedorId: string;
  proveedorId: string;
  cantidad: number;
}

/**
 * @description Extracts, coerces, and filters valid order lines from the pedido form values.
 * Lines missing a productoProveedorId, proveedorId, or with a non-positive cantidad are dropped.
 * @param formData - Raw form values from the pedido form
 * @returns Array of normalized, validated order lines ready for API calls
 */
export const extractPedidoLines = (
  formData: PedidoFormValues
): NormalizedPedidoLine[] => {
  const lines = Array.isArray(formData.pedidoProductos)
    ? formData.pedidoProductos
    : [];

  return lines
    .map((line) => {
      const current = line as {
        id?: string;
        productoProveedorId?: string;
        proveedorId?: string;
        cantidad?: number | string;
        productoProveedor?: {
          proveedor?: { id?: string };
          proveedorId?: string;
        };
      };

      const productoProveedorId = (current.productoProveedorId || '').trim();
      const proveedorId = (
        current.proveedorId ||
        current.productoProveedor?.proveedor?.id ||
        current.productoProveedor?.proveedorId ||
        ''
      ).trim();

      return {
        id: current.id,
        productoProveedorId,
        proveedorId,
        cantidad: Number(current.cantidad),
      };
    })
    .filter(
      (line) =>
        Boolean(line.productoProveedorId) &&
        Boolean(line.proveedorId) &&
        Number.isFinite(line.cantidad) &&
        line.cantidad > 0
    );
};

/**
 * @description Groups normalized pedido lines by their provider ID.
 * Lines without a resolved provider ID are silently skipped.
 * @param lines - Normalized order lines to group
 * @param fallbackProviderId - Optional provider ID to use when a line has no explicit provider
 * @returns Map from proveedorId to the list of lines belonging to that provider
 */
export const groupPedidoLinesByProvider = (
  lines: NormalizedPedidoLine[],
  fallbackProviderId?: string
): Map<string, NormalizedPedidoLine[]> => {
  const linesByProvider = new Map<string, NormalizedPedidoLine[]>();

  lines.forEach((line) => {
    const providerId = (line.proveedorId || fallbackProviderId || '').trim();
    if (!providerId) {
      return;
    }

    if (!linesByProvider.has(providerId)) {
      linesByProvider.set(providerId, []);
    }
    linesByProvider.get(providerId)?.push(line);
  });

  return linesByProvider;
};

/**
 * @description Builds the API payload for updating an existing pedido.
 * @param proveedorId - The provider ID associated with the order
 * @param observaciones - Optional general observations for the order
 * @param lines - Normalized lines to include in the update
 * @returns UpdatePedidoPayload ready to be sent to the API
 */
export const buildPedidoUpdatePayload = (
  proveedorId: string,
  observaciones: string | undefined,
  lines: NormalizedPedidoLine[]
): UpdatePedidoPayload => ({
  proveedorId,
  observaciones,
  lineas: lines.map((line) => ({
    productoProveedorId: line.productoProveedorId,
    cantidad: line.cantidad,
  })),
});

/**
 * @description Builds the API payload for creating a new pedido for a single provider.
 * @param proveedorId - The provider ID for the new order
 * @param observaciones - Optional general observations for the order
 * @param lines - Normalized lines to include in the new order
 * @returns CreatePedidoPayload ready to be sent to the API
 */
export const buildCreatePedidoPayload = (
  proveedorId: string,
  observaciones: string | undefined,
  lines: NormalizedPedidoLine[]
): CreatePedidoPayload => ({
  proveedorId,
  observaciones,
  lineas: lines.map((line) => ({
    productoProveedorId: line.productoProveedorId,
    cantidad: line.cantidad,
  })),
});

/**
 * @description Builds the API payload for creating or updating a purchase batch (lote de compra).
 * Preserves existing line IDs so the backend can perform upsert operations.
 * @param observaciones - Optional observations for the batch
 * @param lines - Normalized lines (with optional existing IDs) to include
 * @returns CreatePurchaseBatchPayload ready to be sent to the API
 */
export const buildPurchaseBatchPayload = (
  observaciones: string | undefined,
  lines: NormalizedPedidoLine[]
): CreatePurchaseBatchPayload => ({
  observaciones,
  lineas: lines.map((line) => ({
    id: line.id,
    productoProveedorId: line.productoProveedorId,
    cantidad: line.cantidad,
  })),
});
