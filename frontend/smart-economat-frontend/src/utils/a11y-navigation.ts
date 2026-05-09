/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de navigate to element dentro del flujo de la aplicación.
 *
 * @param targetId Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "navigateToElement" en smart-economat-frontend (SPA).
 * @undefined {string} targetId - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const navigateToElement = (targetId: string): boolean => {
  const element = document.getElementById(targetId);

  if (element) {
    // Asegurar que el elemento pueda recibir el foco programático
    if (element.getAttribute('tabindex') === null) {
      element.setAttribute('tabindex', '-1');
    }

    // 1. Desplazar el elemento a la vista de forma suave
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // 2. Forzar el foco con bloqueo de scroll nativo (ya realizado por nuestra llamada manual)
    element.focus({ preventScroll: true });

    // Actualizar el hash de la URL para consistencia visual y de historial (opcional)
    // window.location.hash = targetId;

    return true;
  }

  return false;
};
