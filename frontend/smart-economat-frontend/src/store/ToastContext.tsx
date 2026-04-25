import React, { useState, useCallback, ReactNode } from 'react';
import { Toast, ToastOptions } from './toast.types';
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
      duration = 6000,
      options?: ToastOptions
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        productCategory: options?.productCategory,
        iconType: options?.iconType,
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
