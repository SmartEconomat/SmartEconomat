import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import theme from './theme/theme';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';

import Productos from './pages/Productos';
import Pedidos from './pages/Pedidos';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Layout) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="productos" element={<Productos />} />
            <Route path="pedidos" element={<Pedidos />} />
            {/* Add more routes here */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
