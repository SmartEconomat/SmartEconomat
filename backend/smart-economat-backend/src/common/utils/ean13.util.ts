import { I18nHelper } from '../helpers/i18n.helper';
/**
 * Documentación en español.
 */

/**
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
