import React, { useContext } from 'react';

import { ToastContext } from './toast.context';
import { ToastOptions } from './toast.types';
import i18n from '../i18n';

/**
 * Ejecuta la lógica de use toast dentro del flujo de la aplicación.
 */
/**
 * Expone "useToast" en smart-economat-frontend (SPA).
 * @undefined {{ success: (key: string, dur?: number, options?: ToastOptions) => void; error: (key: string, dur?: number, options?: ToastOptions) => void; info: (key: string, dur?: number, options?: ToastOptions) => void; warning: (key: string, dur?: number, options?: ToastOptions) => void; }} Datos efectivos después de ejecutar la operación.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }

  const { addToast } = context;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const showToast = React.useCallback(
    (
      key: string,
      type: 'success' | 'error' | 'info' | 'warning',
      dur?: number,
      options?: ToastOptions
    ): void => {
      addToast(
        i18n.t(key, options as Record<string, unknown>),
        type,
        dur,
        options
      );
    },
    [addToast]
  );

  return React.useMemo(
    () => ({
      success: (key: string, dur?: number, options?: ToastOptions) =>
        showToast(key, 'success', dur, options),
      error: (key: string, dur?: number, options?: ToastOptions) =>
        showToast(key, 'error', dur, options),
      info: (key: string, dur?: number, options?: ToastOptions) =>
        showToast(key, 'info', dur, options),
      warning: (key: string, dur?: number, options?: ToastOptions) =>
        showToast(key, 'warning', dur, options),
    }),
    [showToast]
  );
};

/**
 * Ejecuta la lógica de use toast list dentro del flujo de la aplicación.
 */
/**
 * Expone "useToastList" en smart-economat-frontend (SPA).
 * @undefined {{ toasts: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/store/toast.types").Toast[]; removeToast: (id: string) => void; }} Datos efectivos después de ejecutar la operación.
 */
export const useToastList = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }
  return { toasts: context.toasts, removeToast: context.removeToast };
};
