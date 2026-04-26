/**
 * Documentación en español.
 */

/**
 * Documentación en español.
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
