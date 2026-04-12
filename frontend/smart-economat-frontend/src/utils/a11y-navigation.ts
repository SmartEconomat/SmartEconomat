/**
 * Utilidades de navegación para accesibilidad (A11y).
 */

/**
 * Mueve el foco de forma segura y desplaza la vista a un elemento específico por su ID.
 * Implementa el patrón estándar de Skip Links y Atajos de Teclado.
 * 
 * @param targetId ID del elemento destino.
 * @returns true si se encontró y enfocó el elemento, false en caso contrario.
 */
export const navigateToElement = (targetId: string): boolean => {
  const element = document.getElementById(targetId);
  
  if (element) {
    // Asegurar que el elemento pueda recibir el foco programático
    // (tabIndex -1 permite focus() pero no entrar en el flujo normal de Tab)
    if (element.getAttribute('tabindex') === null) {
      element.setAttribute('tabindex', '-1');
    }
    
    // 1. Forzar el foco con bloqueo TOTAL de scroll nativo
    // Se elimina el scroll programático para evitar movimientos que descoloquen la vista.
    element.focus({ preventScroll: true });
    
    // Actualizar el hash de la URL para consistencia visual y de historial (opcional)
    // window.location.hash = targetId; 
    
    return true;
  }
  
  return false;
};
