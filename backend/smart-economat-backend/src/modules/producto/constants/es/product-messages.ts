import { LanguageEnum } from '../../../../common/enums/languages/language.enum';

export const ProductMessages = {
  NOT_FOUND: (id: number | string) => `Producto con ID "${id}" no encontrado`,
};

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
