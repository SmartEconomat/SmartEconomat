import { Request, Response } from 'express';
import { translate } from '../utils/translator';

/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export function loginController(req: Request, res: Response): void {
  const lang = req.query['lang'] as string | undefined;
  res.json({
    message: translate('auth.login.success', lang),
  });
}
