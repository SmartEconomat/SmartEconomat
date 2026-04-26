import i18next from '../i18n';

/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export function translate(
  key: string,
  lang?: string,
  options?: Record<string, unknown>
): string {
  if (lang) {
    return i18next.getFixedT(lang)(key, options);
  }
  return i18next.t(key, options);
}
