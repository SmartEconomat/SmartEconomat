/**
 * @module LanguageEnum
 * Supported language codes for the SmartEconomat application.
 * Used to configure locale-specific behavior such as i18n and number formatting.
 */

/**
 * Enumeration of supported ISO 639-1 language codes.
 *
 * @constant
 * @example
 * import { LanguageEnum } from './language.enum';
 * const lang = LanguageEnum.ES;
 */
export const LanguageEnum = {
  /** Spanish */
  ES: 'es',
  /** English */
  EN: 'en',
  /** French */
  FR: 'fr',
  /** German */
  DE: 'de',
};
