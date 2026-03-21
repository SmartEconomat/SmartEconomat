import React, { ComponentType } from 'react';
import { usePermission } from '../../../hooks/usePermission';

export interface WithPermissionProps {
  fallback?: React.ReactNode;
}

/**
 * HOC that protects a component so it only renders if the current user
 * has the specific permission(s).
 *
 * @param WrappedComponent El componente a envolver.
 * @param requiredPermissions El/los permisos para evaluar.
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermissions: string | string[]
) {
  return function WithPermissionWrapper(props: P & WithPermissionProps) {
    const { fallback, ...restProps } = props;
    const hasAccess = usePermission(requiredPermissions);

    if (!hasAccess) {
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }
      return null;
    }

    return <WrappedComponent {...(restProps as P)} />;
  };
}
