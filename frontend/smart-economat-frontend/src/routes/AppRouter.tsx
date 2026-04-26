import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {} from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { menuItems } from '../utils/config/menuConfig';

const Login = React.lazy(() => import('../features/auth/Login'));
const ResetPassword = React.lazy(
  () => import('../features/auth/ResetPassword')
);

import LinearLoader from '../components/ui/LinearLoader';

const LoadingFallback = () => <LinearLoader fixed />;

/**
 * Documentación en español.
 */
const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rutas públicas (acceso y recuperación) */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Rutas protegidas (aplicación autenticada) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              path="/recepcion"
              element={<Navigate to="/recepciones" replace />}
            />
            {menuItems.map((item) => (
              <Route
                key={item.path}
                path={item.path}
                element={
                  <ProtectedRoute
                    requiredPermission={item.permiso}
                    requiredAnyPermissions={item.anyPermissions}
                  >
                    <item.component />
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>
        </Route>

        {/* Redirección de fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
