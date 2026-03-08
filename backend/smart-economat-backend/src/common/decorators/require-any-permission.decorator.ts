import { SetMetadata } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from './require-permissions.decorator';

/**
 * Decorador para especificar que el usuario necesita al menos UNO de los permisos especificados (modo OR).
 *
 * @param permissions - Array de códigos de permisos
 *
 * @example
 * ```typescript
 * @Get('reportes')
 * @RequireAnyPermission('reportes:exportar', 'dashboard:ver_estadisticas')
 * exportarReportes() { ... }
 * ```
 */
export const RequireAnyPermission = (...permissions: string[]) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>
  ) => {
    if (propertyKey) {
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor!
      );
      SetMetadata(PERMISSIONS_MODE_KEY, 'any')(
        target,
        propertyKey,
        descriptor!
      );
    } else {
      SetMetadata(
        PERMISSIONS_KEY,
        permissions
      )(target as (...args: unknown[]) => unknown);
      SetMetadata(
        PERMISSIONS_MODE_KEY,
        'any'
      )(target as (...args: unknown[]) => unknown);
    }
  };
};
