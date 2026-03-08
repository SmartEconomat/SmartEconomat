import { SetMetadata } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from './require-permissions.decorator';

/**
 * Decorador para aplicar permisos requeridos a TODOS los endpoints de un controlador.
 * Los permisos a nivel de método individual se suman a estos permisos base.
 *
 * @param permissions - Array de códigos de permisos que se aplicarán a todo el controlador
 *
 * @example
 * ```typescript
 * @Controller('usuarios')
 * @ControllerPermissions('usuarios:acceso')
 * export class UsuarioController {
 *   @Get() // Requiere: usuarios:acceso
 *   findAll() { ... }
 *
 *   @Post()
 *   @RequirePermissions('usuarios:crear') // Requiere: usuarios:acceso + usuarios:crear
 *   create() { ... }
 * }
 * ```
 */
export const ControllerPermissions = (...permissions: string[]) => {
  return (target: object) => {
    SetMetadata(
      PERMISSIONS_KEY,
      permissions
    )(target as (...args: unknown[]) => unknown);
    SetMetadata(
      PERMISSIONS_MODE_KEY,
      'all'
    )(target as (...args: unknown[]) => unknown);
  };
};
