import { useContext, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { AuthContext } from './context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermission = (
  permiso: string | string[] | undefined
): boolean => {
  const permissionsMap = useAppSelector(
    (state) => state.permissions.permissions
  );

  return useMemo(() => {
    if (!permiso) return true;
    if (Array.isArray(permiso)) {
      if (permiso.length === 0) return true;
      return permiso.every((p) => !!permissionsMap[p]);
    }
    return !!permissionsMap[permiso];
  }, [permissionsMap, permiso]);
};

export const useAnyPermission = (permisos: string[]): boolean => {
  const permissionsMap = useAppSelector(
    (state) => state.permissions.permissions
  );
  return useMemo(() => {
    if (!permisos || permisos.length === 0) return true;
    return permisos.some((p) => !!permissionsMap[p]);
  }, [permissionsMap, permisos]);
};
