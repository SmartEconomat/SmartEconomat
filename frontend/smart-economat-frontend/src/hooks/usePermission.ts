import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { RootState } from '../store';

/**
 * Checks if the user has a specific permission.
 * Selector for useAppSelector.
 */
export const hasPermission = (permissionName: string) => (state: RootState) => {
  return !!state.permissions.permissions[permissionName];
};

/**
 * Hook to evaluate if the current user has the specified permissions.
 * Reacciona automáticamente a cambios en estado global (Redux).
 *
 * @param requiredPermissions - Cadena o arreglo de cadenas con los permisos requeridos
 * @returns boolean true si tiene algún permiso o todos (depende de la lógica).
 * Actualmente requiere TODOS los permisos si es un array, o solo uno si es string.
 */
export const usePermission = (requiredPermissions: string | string[]) => {
  const permissionsMap = useAppSelector(
    (state) => state.permissions.permissions
  );

  return useMemo(() => {
    if (!requiredPermissions) return true;

    if (Array.isArray(requiredPermissions)) {
      if (requiredPermissions.length === 0) return true;
      return requiredPermissions.every((perm) => !!permissionsMap[perm]);
    }

    return !!permissionsMap[requiredPermissions];
  }, [permissionsMap, requiredPermissions]);
};
