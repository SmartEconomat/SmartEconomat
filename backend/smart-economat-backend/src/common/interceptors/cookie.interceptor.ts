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
 * Documentación en español.
 */
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
});

/**
 * Documentación en español.
 */
@Injectable()
export class CookieInterceptor implements NestInterceptor {
  /**
   * Documentación en español.
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
