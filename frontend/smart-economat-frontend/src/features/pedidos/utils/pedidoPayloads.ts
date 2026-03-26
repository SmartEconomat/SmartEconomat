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
        id_producto_proveedor?: string;
        proveedorId?: string;
        cantidad?: number | string;
        productoProveedor?: {
          proveedor?: { id?: string };
          proveedorId?: string;
        };
      };

      return {
        id: current.id,
        productoProveedorId:
          current.productoProveedorId || current.id_producto_proveedor || '',
        proveedorId:
          current.proveedorId ||
          current.productoProveedor?.proveedor?.id ||
          current.productoProveedor?.proveedorId ||
          '',
        cantidad: Number(current.cantidad),
      };
    })
    .filter(
      (line) =>
        Boolean(line.productoProveedorId) &&
        Number.isFinite(line.cantidad) &&
        line.cantidad > 0
    );
};

export const groupPedidoLinesByProvider = (
  lines: NormalizedPedidoLine[],
  fallbackProviderId?: string
): Map<string, NormalizedPedidoLine[]> => {
  const linesByProvider = new Map<string, NormalizedPedidoLine[]>();

  lines.forEach((line) => {
    const providerId = line.proveedorId || fallbackProviderId || '';
    if (!linesByProvider.has(providerId)) {
      linesByProvider.set(providerId, []);
    }
    linesByProvider.get(providerId)?.push(line);
  });

  return linesByProvider;
};

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
