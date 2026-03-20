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

const LoadingFallback = () => <Spinner overlay="screen" size="lg" />;

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
              {menuItems.map((item) => (
                <Route
                  key={item.path}
                  path={item.path}
                  element={<item.component />}
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
