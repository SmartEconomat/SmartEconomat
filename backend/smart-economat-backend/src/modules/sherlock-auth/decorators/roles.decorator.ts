import { SetMetadata } from '@nestjs/common';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

/** Constantes públicas (ROLES_KEY) expuestas en smart-economat-backend (Nest). */
export const ROLES_KEY = 'roles';
/**
 * Expone "Roles" en smart-economat-backend (Nest).
 * @undefined {rolUsuario[]} roles - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@nestjs/common/index").CustomDecorator<string>} Datos efectivos después de ejecutar la operación.
 */
export const Roles = (...roles: rolUsuario[]) => SetMetadata(ROLES_KEY, roles);
