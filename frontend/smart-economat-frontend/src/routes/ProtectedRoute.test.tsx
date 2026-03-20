import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../store/auth.context';
import type { AuthContextType, User } from '../store/auth.types';

const createToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

const buildAuthContext = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => ({
  isAuthenticated: true,
  isAuthResolved: true,
  isSessionVerified: true,
  verifiedToken: createToken({ exp: 9999999999 }),
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
  initialEntry = '/administracion',
}: {
  authContext: AuthContextType;
  requiredPermission?: string;
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
              <ProtectedRoute requiredPermission={requiredPermission}>
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
    localStorage.clear();
  });

  it('renders the protected view when JWT and permission are valid', () => {
    localStorage.setItem('token', createToken({ exp: 9999999999 }));

    renderProtectedRoute({
      authContext: buildAuthContext(),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('redirects to home when the user lacks the required permission', () => {
    localStorage.setItem('token', createToken({ exp: 9999999999 }));

    const userWithoutPermission: User = {
      id: 'user-2',
      name: 'Limited User',
      email: 'limited@example.com',
      rol: 'ADMIN',
      permisos: ['productos:listar'],
    };

    renderProtectedRoute({
      authContext: buildAuthContext({ user: userWithoutPermission }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('redirects to login and logs out when the JWT is expired', async () => {
    const logout = vi.fn();
    localStorage.setItem('token', createToken({ exp: 1 }));

    renderProtectedRoute({
      authContext: buildAuthContext({ logout }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByText('Login')).toBeInTheDocument();
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('shows a loading spinner while the backend session check is pending', () => {
    localStorage.setItem('token', createToken({ exp: 9999999999 }));

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

  it('revalidates when the token in storage differs from the verified token', () => {
    const refreshUser = vi.fn();
    localStorage.setItem('token', createToken({ exp: 9999999999, sub: 'new' }));

    renderProtectedRoute({
      authContext: buildAuthContext({
        refreshUser,
        verifiedToken: createToken({ exp: 9999999999, sub: 'old' }),
      }),
      requiredPermission: 'usuarios:listar',
    });

    expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });
});
