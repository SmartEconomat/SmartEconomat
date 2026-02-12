import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { menuItems } from '../config/menuConfig';

const Login = React.lazy(() => import('../components/auth/Login'));

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
);

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Public Routes (Login/Register) */}
                    <Route element={<PublicRoute />}>
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<Login />} />
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
