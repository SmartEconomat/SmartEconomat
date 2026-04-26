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
 * Documentación en español.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

        /**
     * Documentación en español.
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
