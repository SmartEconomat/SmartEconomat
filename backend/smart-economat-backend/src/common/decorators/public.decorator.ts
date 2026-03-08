import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para rutas públicas
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar una ruta como pública (sin autenticación ni autorización requerida).
 *
 * @example
 * ```typescript
 * @Post('login')
 * @Public()
 * login(@Body() dto: LoginDto) { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
