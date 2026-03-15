import React, { useState, useCallback, ReactNode } from 'react';
import { CategoriaProducto } from '../services/producto.types';
import { Toast } from './toast.types';
import { ToastContext } from './toast.context';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning',
      duration = 3000,
      options?: { productCategory?: CategoriaProducto }
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        productCategory: options?.productCategory,
      };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      if (duration !== Infinity) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
