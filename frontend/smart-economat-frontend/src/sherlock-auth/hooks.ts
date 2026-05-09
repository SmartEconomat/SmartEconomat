import { useContext, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { AuthContext } from './context';
import { isElevatedRole } from './permissions';

/**
 * Expone "useAuth" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/sherlock-auth/types").AuthContextType} Datos efectivos después de ejecutar la operación.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Expone "usePermission" en smart-economat-frontend (SPA).
 * @undefined {string | string[] | undefined} permiso - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const usePermission = (
  permiso: string | string[] | undefined
): boolean => {
  const userRole = useContext(AuthContext)?.user?.rol;
  const permissionsMap = useAppSelector(
    (state) => state.permissions.permissions
  );

  return useMemo(() => {
    if (isElevatedRole(userRole)) return true;
    if (!permiso) return true;
    if (Array.isArray(permiso)) {
      if (permiso.length === 0) return true;
      return permiso.every((p) => !!permissionsMap[p]);
    }
    return !!permissionsMap[permiso];
  }, [permissionsMap, permiso, userRole]);
};

/**
 * Expone "useAnyPermission" en smart-economat-frontend (SPA).
 * @undefined {string[]} permisos - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const useAnyPermission = (permisos: string[]): boolean => {
  const userRole = useContext(AuthContext)?.user?.rol;
  const permissionsMap = useAppSelector(
    (state) => state.permissions.permissions
  );
  return useMemo(() => {
    if (isElevatedRole(userRole)) return true;
    if (!permisos || permisos.length === 0) return true;
    return permisos.some((p) => !!permissionsMap[p]);
  }, [permissionsMap, permisos, userRole]);
};
