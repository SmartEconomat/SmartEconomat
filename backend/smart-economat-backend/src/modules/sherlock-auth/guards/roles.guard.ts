import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isSherlockElevatedRole } from '../utils/access.utils';

/**
 * Representa sherlock roles guard en el sistema.
 */
@Injectable()
export class SherlockRolesGuard implements CanActivate {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly reflector Parámetro de entrada para la operación.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determina si activate.
   *
   * @param context Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
