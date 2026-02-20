import { SetMetadata } from '@nestjs/common';
import { rolUsuario } from '../../enums/usuario.enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: rolUsuario[]) => SetMetadata(ROLES_KEY, roles);
