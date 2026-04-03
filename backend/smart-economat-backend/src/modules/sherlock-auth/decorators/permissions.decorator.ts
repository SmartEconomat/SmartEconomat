import { SetMetadata, applyDecorators } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

/**
 * Decorador para exigir uno o varios permisos específicos.
 * Se utiliza applyDecorators para asegurar que múltiples metadatos se registren
 * correctamente y sean detectables por Reflector.getAllAndOverride.
 *
 * @param permissions Lista de códigos de permiso (ej. 'productos:crear')
 */
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'all')
  );

/**
 * Decorador para exigir al menos uno de los permisos listados.
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'any')
  );

/**
 * Decorador de clase para definir permisos base requeridos en todo el controlador.
 */
export const ControllerPermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'all')
  );
