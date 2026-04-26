/**
 * Documentación en español.
 */

/**
 * Documentación en español.
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
