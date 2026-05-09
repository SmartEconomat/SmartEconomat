/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "isValidBarcode" en smart-economat-backend (Nest).
 * @undefined {string | undefined} code - Entrada efectiva esperada por el contrato.
 * @undefined {number} maxLength - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function isValidBarcode(
  code: string | undefined,
  maxLength = 130
): boolean {
  if (code === undefined || code === null) return false;
  return (
    typeof code === 'string' &&
    code.trim().length > 0 &&
    code.trim().length <= maxLength
  );
}
