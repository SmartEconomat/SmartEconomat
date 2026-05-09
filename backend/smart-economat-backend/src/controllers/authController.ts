import { Request, Response } from 'express';
import { translate } from '../utils/translator';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de login controller dentro del flujo de la aplicación.
 *
 * @param req Parámetro de entrada para la operación.
 * @param res Parámetro de entrada para la operación.
 */
/**
 * Expone "loginController" en smart-economat-backend (Nest).
 * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>>} req - Entrada efectiva esperada por el contrato.
 * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function loginController(req: Request, res: Response): void {
  const lang = req.query['lang'] as string | undefined;
  res.json({
    message: translate('auth.login.success', lang),
  });
}
