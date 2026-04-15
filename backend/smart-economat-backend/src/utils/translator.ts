import i18next from '../i18n';

/**
 * @module translator
 * Utilidad centralizada para traducir claves i18n en el backend.
 *
 * Usa la instancia global de i18next configurada en `src/i18n/index.ts`.
 * El idioma activo se establece previamente mediante el middleware
 * `languageDetector`.
 */

/**
 * Traduce una clave i18n al idioma indicado o al idioma activo en i18next.
 *
 * @param {string} key - Clave de traducción en notación de punto, p. ej. `'auth.login.success'`.
 * @param {string} [lang] - Código de idioma ISO 639-1. Si se omite, usa el idioma activo.
 * @param {object} [options] - Opciones de interpolación de i18next (p. ej. `{ name: 'Sergio' }`).
 * @returns {string} Cadena traducida. Devuelve la clave si no existe traducción.
 * @example
 * translate('auth.login.success', 'en')
 * translate('errors.notFound', 'es')
 * translate('dashboard.greeting', 'es', { name: 'Ana' })
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
