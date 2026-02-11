import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import theme from './theme/theme';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';

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
