import type { CategoriaProducto } from '../services/producto.types';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  productCategory?: CategoriaProducto;
  iconType?: 'navigation' | 'normal';
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  productCategory?: CategoriaProducto;
  iconType?: 'navigation' | 'normal';
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (
    message: string,
    type: ToastType,
    duration?: number,
    options?: ToastOptions
  ) => void;
  removeToast: (id: string) => void;
}
