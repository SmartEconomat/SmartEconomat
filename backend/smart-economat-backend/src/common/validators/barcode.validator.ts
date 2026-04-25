/**
 * @module BarcodeValidator
 * Utility function for validating barcode strings used in the SmartEconomat inventory system.
 * Validates that a barcode is a non-empty string within the allowed length limit.
 */

/**
 * Validates whether a barcode string is structurally valid.
 *
 * A valid barcode must be:
 * - A non-`null`, non-`undefined` string
 * - Non-empty after trimming whitespace
 * - At most `maxLength` characters long (after trimming)
 *
 * @param {string | undefined} code - The barcode string to validate.
 * @param {number} [maxLength=130] - Maximum allowed length of the trimmed barcode.
 * @returns {boolean} `true` if the barcode is valid; `false` otherwise.
 *
 * @example
 * isValidBarcode('1234567890123');
 * isValidBarcode('');
 * isValidBarcode(undefined);
 * isValidBarcode('ABC', 2);
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
