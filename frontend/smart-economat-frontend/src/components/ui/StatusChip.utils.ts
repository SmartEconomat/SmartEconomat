import { CategoriaProducto } from '../../services/producto.types';

export type StatusType =
  | 'success'
  | 'completed'
  | 'delivered'
  | 'approved'
  | 'error'
  | 'failed'
  | 'cancelled'
  | 'rejected'
  | 'warning'
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'info'
  | 'active'
  | 'archived'
  | 'fácil'
  | 'media'
  | 'difícil'
  | 'default'
  | 'unknown';

// Ancho fijo para chips de categoría de producto
export const CATEGORY_CHIP_MIN_WIDTH = 110;

// Conjunto de valores de CategoriaProducto para detección rápida
const CATEGORIA_VALUES = new Set<string>(Object.values(CategoriaProducto));

export const isCategoriaProducto = (
  status: string
): status is CategoriaProducto => CATEGORIA_VALUES.has(status.toLowerCase());

export const getStatusColor = (
  status: string
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  if (!status) return 'default';
  const normalizedStatus =
    typeof status === 'string'
      ? status.toLowerCase()
      : String(status).toLowerCase();

  switch (normalizedStatus) {
    case 'success':
    case 'completed':
    case 'delivered':
    case 'entregado':
    case 'en_almacen':
    case 'approved':
    case 'recibido':
    case 'fácil':
    case 'entrada':
    case 'entrada_compra':
    case 'entrada_distribucion':
    case 'completado':
    case 'entregada':
      return 'success';
    case 'error':
    case 'failed':
    case 'cancelled':
    case 'cancelado':
    case 'rejected':
    case 'difícil':
    case 'salida':
    case 'salida_distribucion':
    case 'salida_elaboracion':
      return 'error';
    case 'warning':
    case 'review':
    case 'media':
    case 'ajuste':
    case 'pendiente':
    case 'preparada':
    case 'preparado':
      return 'warning';
    case 'in_progress':
    case 'en_proceso':
    case 'parcial':
    case 'info':
    case 'active':
    case 'archived':
    case 'pedido':
      return 'info';
    default:
      return 'default';
  }
};

export const capitalize = (text: string) => {
  if (!text) return '';
  const spacedText = text.replace(/[_]/g, ' ');
  return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
};
