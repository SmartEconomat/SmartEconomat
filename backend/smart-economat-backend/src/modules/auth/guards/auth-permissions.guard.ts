import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../../../common/decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthorizationService } from '../service/authorization.service';

/**
 * Guard principal de autorización basado en permisos dinámicos.
 *
 * Valida que el usuario autenticado posea los permisos necesarios
 * para acceder a la ruta solicitada.
 *
 * Características:
 * - Consulta permisos desde cache (< 5ms) o BD
 * - Soporta modo AND (todos los permisos) y OR (al menos uno)
 * - Combina permisos de controlador + método
 * - Respeta rutas públicas (@Public())
 */
@Injectable()
export class AuthPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(AuthPermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const methodPermissions =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    const controllerPermissions =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getClass()) || [];

    const requiredPermissions = [
      ...controllerPermissions,
      ...methodPermissions,
    ];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const permissionsMode =
      this.reflector.getAllAndOverride<'all' | 'any'>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'all';

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.warn(
        'Usuario no autenticado intentando acceder a ruta protegida'
      );
      throw new ForbiddenException(
        I18nHelper.getError('USUARIO_NO_AUTENTICADO')
      );
    }

    const hasPermission: boolean =
      permissionsMode === 'any'
        ? await this.authorizationService.userHasAnyPermission(
            String(user.id),
            requiredPermissions
          )
        : await this.authorizationService.userHasAllPermissions(
            String(user.id),
            requiredPermissions
          );

    if (!hasPermission) {
      const mode = permissionsMode === 'any' ? 'al menos uno de' : 'todos';
      const message = `No tienes los permisos necesarios. Requiere ${mode}: ${requiredPermissions.join(', ')}`;

      this.logger.warn(
        `Usuario ${user.id} (${user.nombre || 'sin nombre'}) denegado. ${message}`
      );

      throw new ForbiddenException({
        message,
        requiredPermissions,
        mode: permissionsMode || 'all',
      });
    }

    this.logger.debug(
      `Usuario ${user.id} autorizado con permisos: ${requiredPermissions.join(', ')}`
    );

    return true;
  }
}

export { AuthPermissionsGuard as PermisosGuard };
