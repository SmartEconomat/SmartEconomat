import React, { useContext } from 'react';

import { ToastContext } from './toast.context';
import { ToastOptions } from './toast.types';
import i18n from '../i18n';

/**
 * Documentación en español.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }

  const { addToast } = context;

        /**
     * Documentación en español.
     */
  function showToast(
    key: string,
    type: 'success' | 'error' | 'info' | 'warning',
    dur?: number,
    options?: ToastOptions
  ): void {
    addToast(
      i18n.t(key, options as Record<string, unknown>),
      type,
      dur,
      options
    );
  }

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
    [addToast]
  );
};

/**
 * Documentación en español.
 */
export const useToastList = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }
  return { toasts: context.toasts, removeToast: context.removeToast };
};
