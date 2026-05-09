import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Middleware para protección contra ataques CSRF (Cross-Site Request Forgery).
 * Genera un token XSRF, lo almacena en una cookie y valida que esté presente en las peticiones de cambio de estado.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

  /**
   * Aplica las políticas de seguridad CSRF a la petición.
   * Genera un token si no existe, lo establece en una cookie segura y valida tokens en peticiones de cambio de estado.
   * @param req Objeto de petición HTTP.
   * @param res Objeto de respuesta HTTP.
   * @param next Función para pasar al siguiente middleware.
   * @throws ForbiddenException Si se detecta una petición CSRF inválida o un token faltante.
   */
  /**
   * Expone "use" en smart-economat-backend (Nest).
   * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>>} req - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {NextFunction} next - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  use(req: Request, res: Response, next: NextFunction) {
    const tokenInCookie = req.cookies['XSRF-TOKEN'];

    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const isStateChanging = !safeMethods.includes(req.method);

    if (!tokenInCookie) {
      const newToken = crypto.randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }

    if (isStateChanging) {
      const tokenInHeader = req.headers['x-xsrf-token'] as string;

      if (!tokenInCookie || !tokenInHeader || tokenInCookie !== tokenInHeader) {
        this.logger.warn(
          `Intento de ataque CSRF detectado o token faltante. Método: ${req.method}, Path: ${req.path}`
        );
        throw new ForbiddenException(I18nHelper.getError('CSRF_INVALID'));
      }
    }

    next();
  }
}
