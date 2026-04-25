import { Request, Response, NextFunction } from 'express';
import i18next from '../i18n';

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

/**
 * Resuelve el idioma activo para un request siguiendo esta prioridad:
 * 1. Query param `?lang=`
 * 2. Cabecera `Accept-Language`
 * 3. Idioma por defecto (`es`)
 *
 * @param {Request} req - Request de Express.
 * @returns {string} Código de idioma ISO 639-1 soportado.
 * @example
 * resolveLanguage(req)
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
 * Middleware Express que detecta el idioma del request y lo aplica
 * a la instancia global de i18next.
 *
 * Prioridad de detección: `?lang=` → `Accept-Language` → `es`.
 *
 * @param {Request} req - Request de Express.
 * @param {Response} res - Response de Express.
 * @param {NextFunction} next - Función next del middleware.
 * @returns {void}
 * @example
 * app.use(languageDetector);
 */
export function languageDetector(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const lang = resolveLanguage(req);
  i18next.changeLanguage(lang);
  next();
}
