import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

/**
 * @description Returns the standard cookie options used for the `access_token` auth cookie.
 * The cookie is HTTP-only (not readable by JavaScript), uses `strict` SameSite policy,
 * expires after 7 days, and is `secure` only in production to facilitate local development.
 * @returns An options object suitable for `response.cookie()`.
 * @example
 * res.cookie('access_token', token, getAuthCookieOptions());
 */
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
});

/**
 * @description NestJS interceptor that automatically sets the `access_token` HTTP-only
 * cookie whenever the downstream handler returns a response object that contains an
 * `access_token` property. This ensures that auth endpoints transparently persist the
 * JWT in a secure cookie without each controller needing to manage cookie logic manually.
 * @example
 * // Applied on the AuthController login endpoint:
 * \@UseInterceptors(CookieInterceptor)
 * \@Post('login')
 * login(@Body() dto: LoginDto) { ... }
 */
@Injectable()
export class CookieInterceptor implements NestInterceptor {
  /**
   * @description Intercepts the response stream and, if the resolved data contains an
   * `access_token` field, writes it as a secure HTTP-only cookie on the Express response.
   * @param context - NestJS execution context providing access to the HTTP response object.
   * @param next - The downstream call handler whose observable is tapped into.
   * @returns The observable response stream, augmented with a side-effect that sets the cookie.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data: { access_token?: string }) => {
        const response = context.switchToHttp().getResponse<Response>();
        if (data?.access_token) {
          response.cookie(
            'access_token',
            data.access_token,
            getAuthCookieOptions()
          );
        }
      })
    );
  }
}
