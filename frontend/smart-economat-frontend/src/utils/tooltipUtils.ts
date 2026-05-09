/**
 * Obtiene valores o vistas materializadas.
 * @undefined {boolean} sidebarOpen - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} isLearningMode - Entrada efectiva esperada por el contrato.
 * @undefined {string} title - Entrada efectiva esperada por el contrato.
 * @undefined {string} description - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const getTooltipContent = (
  sidebarOpen: boolean,
  isLearningMode: boolean,
  title: string,
  description: string
): string => {
  if (sidebarOpen) {
    if (isLearningMode) {
      return description;
    }
    return '';
  }

  if (isLearningMode) {
    return `${title}: ${description}`;
  }

  return title;
};
