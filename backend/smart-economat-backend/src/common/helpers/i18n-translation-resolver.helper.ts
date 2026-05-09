import { I18nService } from 'nestjs-i18n';

const SUPPORTED_LANGS = new Set(['es', 'en']);
const DEFAULT_LANG = 'es';

const normalizeEnumValue = (value: string): string =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase();

const humanizeValue = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const normalizeI18nLang = (lang?: string | null): string => {
  if (!lang) {
    return DEFAULT_LANG;
  }

  const primary = lang.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGS.has(primary) ? primary : DEFAULT_LANG;
};

export const safeTranslate = (
  i18n: I18nService,
  key: string,
  lang?: string | null,
  fallback?: string
): string => {
  const normalizedLang = normalizeI18nLang(lang);
  const translated = i18n.t(key, { lang: normalizedLang }) as any;
  if (translated && translated !== key && typeof translated === 'string') {
    return translated;
  }

  if (fallback) {
    return fallback;
  }

  return key.split('.').pop() || key;
};

export const translateEnumValue = (
  i18n: I18nService,
  domain:
    | 'recetaDificultad'
    | 'recetaUnidad'
    | 'alergeno'
    | 'movimientoTipo'
    | 'pedidoEstado',
  rawValue?: string | null,
  lang?: string | null
): string => {
  if (!rawValue) {
    return '—';
  }

  const normalizedValue = normalizeEnumValue(rawValue);
  const fallback = humanizeValue(rawValue);
  return safeTranslate(
    i18n,
    `enum.${domain}.${normalizedValue}`,
    lang,
    fallback
  );
};
