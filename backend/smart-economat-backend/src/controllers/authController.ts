import { Request, Response } from 'express';
import { translate } from '../utils/translator';

/**
 * @module authController
 * Controladores HTTP para el dominio de autenticación.
 *
 * Todas las respuestas se internacionalizan con `translate()`, que respeta
 * el idioma resuelto por el middleware `languageDetector`.
 */

/**
 * Gestiona la petición de login de un usuario.
 *
 * En una implementación real validaría credenciales contra la base de datos
 * y generaría un JWT. Este controlador devuelve una respuesta i18n de ejemplo.
 *
 * @param {Request} req - Request de Express. Se espera `req.body.username` y `req.body.password`.
 * @param {Response} res - Response de Express.
 * @returns {void} Responde con JSON `{ message: string }`.
 * @example
 * router.post('/login', loginController);
 */
export function loginController(req: Request, res: Response): void {
  const lang = req.query['lang'] as string | undefined;
  res.json({
    message: translate('auth.login.success', lang),
  });
}
