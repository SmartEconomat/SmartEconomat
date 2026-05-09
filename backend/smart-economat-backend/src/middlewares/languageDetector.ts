import { Request, Response, NextFunction } from 'express';
import i18next from '../i18n';

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

/**
 * Resuelve language a partir del contexto disponible.
 *
 * @param req Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "languageDetector" en smart-economat-backend (Nest).
 * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>>} req - Entrada efectiva esperada por el contrato.
 * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
 * @undefined {NextFunction} next - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
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
