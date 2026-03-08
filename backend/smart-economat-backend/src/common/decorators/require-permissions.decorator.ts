import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para permisos requeridos
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Clave de metadata para indicar si requiere TODOS los permisos (AND) o al menos UNO (OR)
 */
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

/**
 * Decorador para especificar los permisos requeridos en una ruta o controlador.
 * Por defecto, requiere que el usuario tenga TODOS los permisos especificados (modo AND).
 *
 * @param permissions - Array de códigos de permisos (ej: ['usuarios:listar', 'usuarios:ver'])
 *
 * @example
 * ```typescript
 * @Get()
 * @RequirePermissions('usuarios:listar')
 * findAll() { ... }
 *
 * @Post()
 * @RequirePermissions('usuarios:crear', 'usuarios:editar')
 * create() { ... }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) => {
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
      SetMetadata(PERMISSIONS_MODE_KEY, 'all')(
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
        'all'
      )(target as (...args: unknown[]) => unknown);
    }
  };
};
