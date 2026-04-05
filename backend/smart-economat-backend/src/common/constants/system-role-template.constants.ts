import { rolUsuario } from '../../modules/usuario/enums/usuario.enums';

export const SYSTEM_ROLE_TEMPLATE_NAMES = [
  rolUsuario.SUPER_ADMIN,
  rolUsuario.ADMIN,
  rolUsuario.PROFESOR,
  rolUsuario.ALUMNO,
] as const;

export const SYSTEM_ROLE_TEMPLATE_ALIASES: Record<
  rolUsuario,
  readonly string[]
> = {
  [rolUsuario.SUPER_ADMIN]: [
    rolUsuario.SUPER_ADMIN,
    'SUPERADMIN',
    'PLANTILLA ROL SUPERADMIN',
    'PLANTILLA ROL SUPER_ADMIN',
    'PLANTILLA ROL SUPER ADMIN',
  ],
  [rolUsuario.ADMIN]: [rolUsuario.ADMIN, 'PLANTILLA ROL ADMIN'],
  [rolUsuario.PROFESOR]: [rolUsuario.PROFESOR, 'PLANTILLA ROL PROFESOR'],
  [rolUsuario.ALUMNO]: [rolUsuario.ALUMNO, 'PLANTILLA ROL ALUMNO'],
};

export const SYSTEM_ROLE_TEMPLATE_PROTECTED_NAMES = new Set(
  Object.values(SYSTEM_ROLE_TEMPLATE_ALIASES)
    .flat()
    .map((name) => name.trim().toUpperCase())
);

export const SYSTEM_ROLE_TEMPLATE_PERMISSION_LOCKED_NAMES = new Set(
  [
    ...SYSTEM_ROLE_TEMPLATE_ALIASES[rolUsuario.SUPER_ADMIN],
    ...SYSTEM_ROLE_TEMPLATE_ALIASES[rolUsuario.ADMIN],
  ].map((name) => name.trim().toUpperCase())
);

export function getSystemRoleTemplateAliases(
  role: rolUsuario
): readonly string[] {
  return SYSTEM_ROLE_TEMPLATE_ALIASES[role] ?? [role];
}
