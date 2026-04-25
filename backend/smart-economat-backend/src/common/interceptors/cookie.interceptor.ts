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
 * @description Devuelve las opciones estándar de cookie utilizadas para la cookie de autenticación `access_token`.
 * La cookie es HTTP-only (no legible por JavaScript), utiliza la política SameSite `strict`,
 * caduca tras 7 días y es `secure` solo en producción para facilitar el desarrollo local.
 * @returns Un objeto de opciones apto para `response.cookie()`.
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
 * @description Interceptor de NestJS que establece automáticamente la cookie HTTP-only `access_token`
 * cada vez que el manejador descendente devuelve un objeto de respuesta que contiene una
 * propiedad `access_token`. Esto garantiza que los endpoints de autenticación persistan el
 * JWT en una cookie segura de forma transparente sin que cada controlador necesite gestionar la lógica de cookies manualmente.
 * @example
 *
 * \@UseInterceptors(CookieInterceptor)
 * \@Post('login')
 * login(@Body() dto: LoginDto) { ... }
 */
@Injectable()
export class CookieInterceptor implements NestInterceptor {
  /**
   * @description Intercepta el flujo de respuesta y, si los datos resueltos contienen un
   * campo `access_token`, lo escribe como una cookie HTTP-only segura en la respuesta de Express.
   * @param context - Contexto de ejecución de NestJS que proporciona acceso al objeto de respuesta HTTP.
   * @param next - El manejador de llamadas descendente cuyo observable se intercepta.
   * @returns El flujo observable de respuesta, aumentado con un efecto secundario que establece la cookie.
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
