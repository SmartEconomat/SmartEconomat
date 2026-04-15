import React, { ComponentType } from 'react';
import { usePermission } from '../../../hooks/usePermission';

/**
 * Additional props injected by the {@link withPermission} HOC.
 */
export interface WithPermissionProps {
  /** Optional fallback element rendered when the user lacks the required permission. */
  fallback?: React.ReactNode;
}

/**
 * HOC that protects a component so it only renders if the current user
 * has the specific permission(s).
 *
 * When the user does **not** have access:
 * - If `fallback` is provided, it is rendered instead.
 * - Otherwise `null` is returned, hiding the component entirely.
 *
 * @param WrappedComponent - The component to wrap.
 * @param requiredPermissions - One or more permission strings to check.
 * @returns A new component that conditionally renders `WrappedComponent`.
 *
 * @example
 * ```tsx
 * const ProtectedButton = withPermission(MyButton, 'admin:write');
 * // Renders nothing if the user lacks 'admin:write'
 * <ProtectedButton fallback={<span>No access</span>} />
 * ```
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermissions: string | string[]
) {
  /**
   * Inner wrapper component produced by `withPermission`.
   * @param props - Props for `WrappedComponent` plus the optional `fallback`.
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
