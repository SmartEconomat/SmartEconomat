import { useContext, useMemo } from 'react';
import { AuthContext } from './auth.context';
import { hasPermission, hasAnyPermission } from '../utils/auth/permissionUtils';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook para verificar un permiso específico de forma reactiva.
 */
export const usePermission = (permiso: string | undefined): boolean => {
  const { user } = useAuth();
  return useMemo(() => {
    if (!permiso) return true;
    return hasPermission(user, permiso);
  }, [user, permiso]);
};

/**
 * Hook para verificar si se tiene al menos uno de los permisos indicados.
 */
export const useAnyPermission = (permisos: string[]): boolean => {
  const { user } = useAuth();
  return useMemo(() => hasAnyPermission(user, permisos), [user, permisos]);
};
