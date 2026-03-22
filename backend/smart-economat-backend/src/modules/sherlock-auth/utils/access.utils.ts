export const SHERLOCK_AUTH_ROLE_ALIASES = [
  'ADMIN',
  'ADMINISTRADOR',
  'SUPER_ADMIN',
] as const;

export type SherlockAuthRoleAlias = (typeof SHERLOCK_AUTH_ROLE_ALIASES)[number];

export const normalizeSherlockAuthRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

export const isSherlockElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeSherlockAuthRole(role);
  return SHERLOCK_AUTH_ROLE_ALIASES.includes(
    normalized as SherlockAuthRoleAlias
  );
};

export const uniqueStrings = (
  values: Array<string | null | undefined>
): string[] => {
  return [
    ...new Set(
      values.filter(
        (value): value is string => !!value && value.trim().length > 0
      )
    ),
  ].map((value) => value.trim());
};

export interface SherlockEffectivePermissionsInput {
  role?: string | null;
  rolePermissions?: string[];
  directPermissions?: string[];
  excludedPermissions?: string[];
}

export const resolveSherlockEffectivePermissions = (
  input: SherlockEffectivePermissionsInput
): string[] => {
  const rolePermissions = input.rolePermissions ?? [];
  const directPermissions = input.directPermissions ?? [];
  const excludedPermissions = input.excludedPermissions ?? [];

  const merged = uniqueStrings([...rolePermissions, ...directPermissions]);
  const filtered = merged.filter(
    (permission) => !excludedPermissions.includes(permission)
  );

  if (isSherlockElevatedRole(input.role)) {
    return filtered;
  }

  return filtered;
};
