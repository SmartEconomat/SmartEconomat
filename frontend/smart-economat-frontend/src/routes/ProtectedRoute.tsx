import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.hooks';
import { hasPermission } from '../utils/auth/permissionUtils';
import { isJwtUsable } from '../utils/auth/jwtUtils';
import Spinner from '../components/ui/Spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const {
    isAuthenticated,
    isAuthResolved,
    isSessionVerified,
    verifiedToken,
    user,
    logout,
    refreshUser,
  } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const hasValidJwt = isJwtUsable(token);
  const tokenNeedsRevalidation = Boolean(token && token !== verifiedToken);

  React.useEffect(() => {
    if ((!token || !hasValidJwt) && isAuthenticated) {
      logout();
    }
  }, [hasValidJwt, isAuthenticated, logout, token]);

  React.useEffect(() => {
    if (token && hasValidJwt && tokenNeedsRevalidation) {
      void refreshUser();
    }
  }, [hasValidJwt, refreshUser, token, tokenNeedsRevalidation]);

  if (token && hasValidJwt && (!isAuthResolved || tokenNeedsRevalidation)) {
    return <Spinner overlay="screen" size="lg" />;
  }

  if (
    !token ||
    !hasValidJwt ||
    !isAuthenticated ||
    !isSessionVerified ||
    !user
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
