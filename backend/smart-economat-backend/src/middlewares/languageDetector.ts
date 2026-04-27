import { Request, Response, NextFunction } from 'express';
import i18next from '../i18n';

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

/**
 * Documentación en español.
 */
function resolveLanguage(req: Request): string {
  const queryLang = req.query['lang'];
  if (typeof queryLang === 'string' && SUPPORTED_LANGS.includes(queryLang)) {
    return queryLang;
  }

  const headerLang = req.headers['accept-language']
    ?.split(',')[0]
    ?.split('-')[0];
  if (headerLang && SUPPORTED_LANGS.includes(headerLang)) {
    return headerLang;
  }

  return DEFAULT_LANG;
}

/**
 * Documentación en español.
 */
export function languageDetector(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const lang = resolveLanguage(req);
  void i18next.changeLanguage(lang);
  next();
}
