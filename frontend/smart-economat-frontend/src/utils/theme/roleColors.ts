/** Constantes públicas (ROLE_COLORS) expuestas en smart-economat-frontend (SPA). */
export const ROLE_COLORS = {
  Administrador: '#5e35b1', // Púrpura oscuro
  Profesor: '#d81b60', // Rosa vibrante
  Alumno: '#00897b', // Verde pino / Turquesa oscuro
  Default: '#757575', // Gris
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {string} rol - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const getRoleColor = (rol: string): string => {
  if (rol.toLowerCase().includes('admin')) return ROLE_COLORS.Administrador;
  if (rol.toLowerCase().includes('profesor')) return ROLE_COLORS.Profesor;
  if (rol.toLowerCase().includes('alumno')) return ROLE_COLORS.Alumno;
  return ROLE_COLORS.Default;
};
