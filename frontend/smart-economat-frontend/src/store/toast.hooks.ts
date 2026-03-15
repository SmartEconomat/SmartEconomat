import React, { useContext } from 'react';
import { ToastContext } from './toast.context';
import { ToastOptions } from './toast.types';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }

  const { addToast } = context;

  return React.useMemo(
    () => ({
      success: (msg: string, dur?: number, options?: ToastOptions) =>
        addToast(msg, 'success', dur, options),
      error: (msg: string, dur?: number, options?: ToastOptions) =>
        addToast(msg, 'error', dur, options),
      info: (msg: string, dur?: number, options?: ToastOptions) =>
        addToast(msg, 'info', dur, options),
      warning: (msg: string, dur?: number, options?: ToastOptions) =>
        addToast(msg, 'warning', dur, options),
    }),
    [addToast]
  );
};

export const useToastList = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastList debe ser usado dentro de un ToastProvider');
  }
  return { toasts: context.toasts, removeToast: context.removeToast };
};
