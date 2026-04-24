import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isSherlockElevatedRole } from '../utils/access.utils';

/**
 * Authorization guard that enforces role-based access control (RBAC).
 *
 * Reads the required roles from the `@Roles()` decorator metadata and compares
 * them against the role attached to the authenticated user. Elevated roles
 * (e.g. ADMIN, SUPERADMIN) bypass the check and always gain access.
 *
 * This guard must be applied AFTER a JWT authentication guard so that
 * `request.user` is already populated.
 *
 * @class SherlockRolesGuard
 */
@Injectable()
export class SherlockRolesGuard implements CanActivate {
  /**
   * Creates an instance of SherlockRolesGuard.
   * @param {Reflector} reflector - NestJS reflector used to read route metadata.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determines whether the current user has at least one of the required roles.
   *
   * - If no roles are required (no `@Roles()` decorator), access is granted.
   * - If the user's role is an elevated role, access is always granted.
   * - Otherwise, the user's role must appear in the required-roles list.
   *
   * @param {ExecutionContext} context - The NestJS execution context for the request.
   * @returns {boolean} `true` if the user is authorized, `false` otherwise.
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
