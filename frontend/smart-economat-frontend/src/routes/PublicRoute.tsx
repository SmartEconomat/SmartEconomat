import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth.hooks';

const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
