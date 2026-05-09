import React, { ComponentType } from 'react';
import { usePermission } from '../../../hooks/usePermission';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface WithPermissionProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  fallback?: React.ReactNode;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "withPermission" en smart-economat-frontend (SPA).
 * @undefined {React.ComponentType<P>} WrappedComponent - Entrada efectiva esperada por el contrato.
 * @undefined {string | string[]} requiredPermissions - Entrada efectiva esperada por el contrato.
 * @undefined {(props: P & WithPermissionProps) => import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element | null} Datos efectivos después de ejecutar la operación.
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermissions: string | string[]
) {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
