import React, { useContext } from 'react';

import { ToastContext } from './toast.context';
import { ToastOptions } from './toast.types';
import i18n from '../i18n';

/**
 * Hook que expone helpers para lanzar notificaciones toast internacionalizadas.
 *
 * Traduce la clave i18n proporcionada antes de pasarla al contexto,
 * por lo que el componente consumidor no necesita llamar a `t()` de forma explícita.
 *
 * @returns {{ success, error, info, warning }} Objeto con un método por tipo de toast.
 * @throws {Error} Si se usa fuera del `ToastProvider`.
 * @example
 * const toast = useToast();
 * toast.success('recetas.toast.creada', undefined, { nombre: 'Carbonara' });
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }

  const { addToast } = context;

  /**
   * Lanza un toast traduciendo la clave i18n indicada.
   *
   * @param {string} key - Clave i18n del mensaje.
   * @param {'success'|'error'|'info'|'warning'} type - Nivel visual del toast.
   * @param {number} [dur] - Duración en milisegundos.
   * @param {ToastOptions} [options] - Opciones adicionales de interpolación.
   * @returns {void}
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
 * Hook de solo lectura que expone la lista de toasts activos y el método
 * para eliminarlos.
 *
 * @returns {{ toasts: Toast[], removeToast: (id: string) => void }}
 * @throws {Error} Si se usa fuera del `ToastProvider`.
 * @example
 * const { toasts, removeToast } = useToastList();
 */
export const useToastList = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(i18n.t('toast.errors.mustBeUsedInProvider'));
  }
  return { toasts: context.toasts, removeToast: context.removeToast };
};
