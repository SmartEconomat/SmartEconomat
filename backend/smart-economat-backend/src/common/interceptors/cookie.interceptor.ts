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
 * Obtiene auth cookie options.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {{ httpOnly: boolean; secure: boolean; sameSite: "strict"; maxAge: number; path: string; }} Datos efectivos después de ejecutar la operación.
 */
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
});

/**
 * Representa cookie interceptor en el sistema.
 */
@Injectable()
export class CookieInterceptor implements NestInterceptor {
  /**
   * Ejecuta la lógica de intercept dentro del flujo de la aplicación.
   *
   * @param context Parámetro de entrada para la operación.
   * @param next Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
