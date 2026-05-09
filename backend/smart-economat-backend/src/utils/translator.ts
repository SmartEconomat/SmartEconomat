import i18next from '../i18n';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "translate" en smart-economat-backend (Nest).
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} lang - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown> | undefined} options - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
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
