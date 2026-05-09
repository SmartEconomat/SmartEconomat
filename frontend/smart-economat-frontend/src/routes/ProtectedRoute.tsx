import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.hooks';
import { hasAnyPermission, hasPermission } from '../utils/auth/permissionUtils';
import LinearLoader from '../components/ui/LinearLoader';

const AUTHORIZED_FALLBACK_PATH = '/perfil';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredAnyPermissions,
}) => {
  const { isAuthenticated, isAuthResolved, isSessionVerified, user } =
    useAuth();
  const location = useLocation();

  const renderUnauthorizedRedirect = () => {
    if (location.pathname === AUTHORIZED_FALLBACK_PATH) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return (
      <Navigate
        to={AUTHORIZED_FALLBACK_PATH}
        replace
        state={{ from: location }}
      />
    );
  };

  if (!isAuthResolved) {
    return <LinearLoader fixed />;
  }

  if (!isAuthenticated || !isSessionVerified || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return renderUnauthorizedRedirect();
  }

  if (
    requiredAnyPermissions &&
    requiredAnyPermissions.length > 0 &&
    !hasAnyPermission(user, requiredAnyPermissions)
  ) {
    return renderUnauthorizedRedirect();
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
