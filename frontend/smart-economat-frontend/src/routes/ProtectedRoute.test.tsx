import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../store/auth.context';
import type { AuthContextType, User } from '../store/auth.types';

const buildAuthContext = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => ({
  isAuthenticated: true,
  isAuthResolved: true,
  isSessionVerified: true,
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    rol: 'ADMIN',
    permisos: ['usuarios:listar'],
  },
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  ...overrides,
});

const renderProtectedRoute = ({
  authContext,
  requiredPermission,
  requiredAnyPermissions,
  initialEntry = '/administracion',
}: {
  authContext: AuthContextType;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  initialEntry?: string;
}) =>
  render(
    <AuthContext.Provider value={authContext}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/" element={<div>Inicio</div>} />
          <Route
            path="/administracion"
            element={
              <ProtectedRoute
                requiredPermission={requiredPermission}
                requiredAnyPermissions={requiredAnyPermissions}
              >
                <div>Administración</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the protected view when the session is resolved and authorized', () => {
    renderProtectedRoute({
      authContext: buildAuthContext(),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('redirects to home when the user lacks the required permission', () => {
    const userWithoutPermission: User = {
      id: 'user-2',
      name: 'Limited User',
      email: 'limited@example.com',
      rol: 'PROFESOR',
      permisos: ['productos:listar'],
    };

    renderProtectedRoute({
      authContext: buildAuthContext({ user: userWithoutPermission }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('redirects to login when the resolved session is not authenticated', () => {
    const logout = vi.fn().mockResolvedValue(undefined);

    renderProtectedRoute({
      authContext: buildAuthContext({
        logout,
        isAuthenticated: false,
        isSessionVerified: false,
        user: null,
      }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows a loading spinner while the backend session check is pending', () => {
    renderProtectedRoute({
      authContext: buildAuthContext({
        isAuthenticated: false,
        isAuthResolved: false,
        isSessionVerified: false,
        user: null,
      }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
  });

  it('renders the protected view when the user has any allowed permission', () => {
    const profesorUser: User = {
      id: 'user-3',
      name: 'Profesor User',
      email: 'profesor@example.com',
      rol: 'PROFESOR',
      permisos: ['profesor:ver_alumnos'],
    };

    renderProtectedRoute({
      authContext: buildAuthContext({ user: profesorUser }),
      requiredAnyPermissions: [
        'usuarios:listar',
        'profesor:gestionar_slots',
        'profesor:ver_alumnos',
      ],
    });

    expect(screen.getByText('Administración')).toBeInTheDocument();
  });
});
