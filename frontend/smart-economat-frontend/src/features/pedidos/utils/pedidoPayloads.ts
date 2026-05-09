import {
  CreatePedidoPayload,
  CreatePurchaseBatchPayload,
  UpdatePedidoPayload,
} from '../../../services/pedido.service';
import { PedidoFormValues } from '../types/pedidos-ui.types';

/** Contrato de tipos público (NormalizedPedidoLine). Contexto: smart-economat-frontend (SPA). */
export interface NormalizedPedidoLine {
  id?: string;
  productoProveedorId: string;
  proveedorId: string;
  cantidad: number;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "extractPedidoLines" en smart-economat-frontend (SPA).
 * @undefined {PedidoFormValues} formData - Entrada efectiva esperada por el contrato.
 * @undefined {NormalizedPedidoLine[]} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "groupPedidoLinesByProvider" en smart-economat-frontend (SPA).
 * @undefined {NormalizedPedidoLine[]} lines - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} fallbackProviderId - Entrada efectiva esperada por el contrato.
 * @undefined {Map<string, NormalizedPedidoLine[]>} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildPedidoUpdatePayload" en smart-economat-frontend (SPA).
 * @undefined {string} proveedorId - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} observaciones - Entrada efectiva esperada por el contrato.
 * @undefined {NormalizedPedidoLine[]} lines - Entrada efectiva esperada por el contrato.
 * @undefined {UpdatePedidoPayload} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildCreatePedidoPayload" en smart-economat-frontend (SPA).
 * @undefined {string} proveedorId - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} observaciones - Entrada efectiva esperada por el contrato.
 * @undefined {NormalizedPedidoLine[]} lines - Entrada efectiva esperada por el contrato.
 * @undefined {CreatePedidoPayload} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildPurchaseBatchPayload" en smart-economat-frontend (SPA).
 * @undefined {string | undefined} observaciones - Entrada efectiva esperada por el contrato.
 * @undefined {NormalizedPedidoLine[]} lines - Entrada efectiva esperada por el contrato.
 * @undefined {CreatePurchaseBatchPayload} Datos efectivos después de ejecutar la operación.
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
