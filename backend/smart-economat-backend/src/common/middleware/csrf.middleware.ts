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
 * @description Middleware that implements the Double Submit Cookie pattern for CSRF protection.
 *
 * Flow:
 * 1. On every request, if no `XSRF-TOKEN` cookie is present, a new cryptographically
 *    random 32-byte hex token is generated and set as a non-httpOnly cookie so that
 *    client-side JavaScript can read it.
 * 2. For state-changing requests (any method other than GET, HEAD, or OPTIONS), the
 *    middleware reads the `X-XSRF-TOKEN` request header and compares it to the cookie
 *    value. A mismatch or missing value results in a `403 ForbiddenException`.
 *
 * @example
 *
 * consumer.apply(CsrfMiddleware).forRoutes('*');
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

  /**
   * @description Executes the CSRF Double-Submit Cookie check for each incoming request.
   * Generates a new token cookie when one is absent and rejects write requests whose
   * `X-XSRF-TOKEN` header does not match the cookie value.
   * @param req - The incoming Express request object. Cookie values and headers are read from it.
   * @param res - The Express response object. The `XSRF-TOKEN` cookie may be set on it.
   * @param next - The Express next-function to invoke when the request passes validation.
   * @throws {ForbiddenException} If the request is state-changing and the CSRF token is
   *   missing from the cookie, missing from the header, or the two values do not match.
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
