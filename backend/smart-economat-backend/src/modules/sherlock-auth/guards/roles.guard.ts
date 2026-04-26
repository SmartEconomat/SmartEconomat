import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isSherlockElevatedRole } from '../utils/access.utils';

/**
 * Documentación en español.
 */
@Injectable()
export class SherlockRolesGuard implements CanActivate {
        /**
     * Documentación en español.
     */
  constructor(private readonly reflector: Reflector) {}

        /**
     * Documentación en español.
     */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<rolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRole = user?.rol as rolUsuario;

    if (isSherlockElevatedRole(userRole)) return true;

    return requiredRoles.includes(userRole);
  }
}
