import type { CategoriaProducto } from '../services/producto.types';

/** Alias público (ToastType) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/** Contrato de tipos público (ToastOptions). Contexto: smart-economat-frontend (SPA). */
export interface ToastOptions {
  productCategory?: CategoriaProducto;
  iconType?: 'navigation' | 'normal';
}

/** Contrato de tipos público (Toast). Contexto: smart-economat-frontend (SPA). */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  productCategory?: CategoriaProducto;
  iconType?: 'navigation' | 'normal';
}

/** Contrato de tipos público (ToastContextType). Contexto: smart-economat-frontend (SPA). */
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
