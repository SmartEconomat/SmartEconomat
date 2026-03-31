import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Middleware para implementar el patrón 'Double Submit Cookie' para protección CSRF.
 * 1. Genera un token aleatorio y lo envía en una cookie no-httpOnly (XSRF-TOKEN).
 * 2. El cliente lee esta cookie y la envía de vuelta en la cabecera (X-XSRF-TOKEN).
 * 3. El middleware valida que ambos valores coincidan en peticiones de escritura.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

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
        throw new ForbiddenException('CSRF Token Invalido o Faltante');
      }
    }

    next();
  }
}
