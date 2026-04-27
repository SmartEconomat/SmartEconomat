import React, { ComponentType } from 'react';
import { usePermission } from '../../../hooks/usePermission';

/**
 * Documentación en español.
 */
export interface WithPermissionProps {
  /**
   * Documentación en español.
   */
  fallback?: React.ReactNode;
}

/**
 * Documentación en español.
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermissions: string | string[]
) {
  /**
   * Documentación en español.
   */
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
