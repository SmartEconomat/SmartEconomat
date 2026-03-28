import { I18nHelper } from '../helpers/i18n.helper';
/**
 * Utility functions for generating and validating EAN-13 barcodes.
 */

/**
 * Calculates the EAN-13 check digit for a 12-digit string.
 * @param digits 12-digit string
 * @returns the check digit (0-9)
 */
export function calculateCheckDigit(digits: string): number {
  if (!/^\d{12}$/.test(digits)) {
    throw new Error(I18nHelper.getError('INPUT_MUST_BE_EXACTLY_12_DIGITS'));
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);

    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Generates a random EAN-13 barcode.
 * @param prefix An optional prefix (default: '200' for internal use).
 * @returns A valid 13-digit EAN-13 barcode string.
 */
export function generateEan13(prefix = '200'): string {
  if (!/^\d+$/.test(prefix) || prefix.length > 12) {
    throw new Error(I18nHelper.getError('INVALID_EAN13_PREFIX'));
  }

  const remainingLength = 12 - prefix.length;
  let randomDigits = '';

  for (let i = 0; i < remainingLength; i++) {
    randomDigits += Math.floor(Math.random() * 10).toString();
  }

  const base12Digits = prefix + randomDigits;
  const checkDigit = calculateCheckDigit(base12Digits);

  return base12Digits + checkDigit.toString();
}

/**
 * Validates if a string is a structurally correct EAN-13 barcode.
 * @param code The string to validate.
 * @returns true if valid, false otherwise.
 */
export function validateEan13(code: string): boolean {
  if (!code || typeof code !== 'string' || !/^\d{13}$/.test(code)) {
    return false;
  }

  const base12Digits = code.substring(0, 12);
  const providedCheckDigit = parseInt(code[12], 10);

  try {
    const expectedCheckDigit = calculateCheckDigit(base12Digits);
    return providedCheckDigit === expectedCheckDigit;
  } catch {
    return false;
  }
}
