import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Spinner from '../components/ui/Spinner';

/**
 * Full-screen loading fallback shown via `React.Suspense` while a lazily
 * loaded route chunk is being fetched.
 *
 * @returns JSX rendered spinner overlay
 */
const LoadingFallback = () => <Spinner overlay="screen" size="lg" />;

/**
 * Root router component for the application.
 *
 * Defines the complete route tree:
 * - **Public routes** (`/login`, `/reset-password`, `/reset-password/:token`)
 *   are wrapped in `PublicRoute` (redirects authenticated users away) and
 *   rendered inside `AuthLayout`.
 * - **Protected routes** are derived dynamically from `menuItems`, wrapped in
 *   `ProtectedRoute` (redirects unauthenticated users to `/login`), and
 *   rendered inside `MainLayout`.
 * - A catch-all `*` route redirects any unknown path to `/`.
 *
 * All route-level components are lazily imported and wrapped in
 * `React.Suspense` with a full-screen spinner as the fallback.
 *
 * @returns JSX rendered browser router with the full route configuration
 *
 * @example
 * // Mount at the application root
 * <AppRouter />
 */
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes (Login/Register/Reset) */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
              />
            </Route>
          </Route>

          {/* Protected Routes (Dashboard) */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
