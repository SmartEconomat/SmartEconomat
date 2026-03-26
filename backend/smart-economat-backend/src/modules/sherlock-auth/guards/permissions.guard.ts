import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { isSherlockElevatedRole } from '../utils/access.utils';

@Injectable()
export class SherlockPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(SherlockPermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(AuthPermissionsService)
    private readonly authPermissionsService: AuthPermissionsService
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
    const user = request.user as { id: string; nombre?: string; rol?: string };

    if (!user || !user.id) {
      this.logger.warn(
        'Usuario no autenticado intentando acceder a ruta protegida'
      );
      throw new ForbiddenException(
        I18nHelper.getError('USUARIO_NO_AUTENTICADO')
      );
    }

    if (isSherlockElevatedRole(user.rol)) {
      return true;
    }

    const hasPermission: boolean =
      permissionsMode === 'any'
        ? await this.authPermissionsService.userHasAnyPermission(
            String(user.id),
            requiredPermissions
          )
        : await this.authPermissionsService.userHasAllPermissions(
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

export { SherlockPermissionsGuard as PermisosGuard };
