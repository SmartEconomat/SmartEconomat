import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.hooks';
import { hasAnyPermission, hasPermission } from '../utils/auth/permissionUtils';
import Spinner from '../components/ui/Spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredAnyPermissions,
}) => {
  const { isAuthenticated, isAuthResolved, isSessionVerified, user } =
    useAuth();
  const location = useLocation();

  if (!isAuthResolved) {
    return <Spinner overlay="screen" size="lg" />;
  }

  if (!isAuthenticated || !isSessionVerified || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  if (
    requiredAnyPermissions &&
    requiredAnyPermissions.length > 0 &&
    !hasAnyPermission(user, requiredAnyPermissions)
  ) {
    return <Navigate to="/" replace />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
