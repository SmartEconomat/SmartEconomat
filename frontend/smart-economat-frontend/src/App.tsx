import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import AppRouter from './routers/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider><BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />     
              <ProtectedRoute>
                <AppRouter />
              </ProtectedRoute>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
