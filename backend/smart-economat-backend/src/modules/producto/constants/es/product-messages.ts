import { LanguageEnum } from '../../../../common/enums/languages/language.enum';

/** Constantes públicas (ProductMessages) expuestas en smart-economat-backend (Nest). */
export const ProductMessages = {
  NOT_FOUND: (id: number | string) => `Producto con ID "${id}" no encontrado`,
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Key} key - Entrada efectiva esperada por el contrato.
 * @undefined {string} lang - Entrada efectiva esperada por el contrato.
 * @undefined {Parameters<{ NOT_FOUND: (id: number | string) => string; }[Key]>} args - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function getProductMessage<Key extends keyof typeof ProductMessages>(
  key: Key,
  lang: string = LanguageEnum.ES,
  ...args: Parameters<(typeof ProductMessages)[Key]>
): string {
  if (lang !== LanguageEnum.ES) {
    console.warn(`Language '${lang}' not supported, falling back to 'es'.`);
  }

  const messageFn = ProductMessages[key];

  if (typeof messageFn === 'function') {
    return (messageFn as (...args: any[]) => string)(...args);
  }

  return String(messageFn);
}
