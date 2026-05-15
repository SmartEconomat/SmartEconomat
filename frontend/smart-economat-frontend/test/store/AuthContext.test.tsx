import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AuthProvider } from '../../src/store/AuthContext';
import { useAuth } from '../../src/store/auth.hooks';
import { authService } from '../../src/services/auth.service';
import { resetPermissions } from '../../src/store/slices/permissionsSlice';

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockDispatch = vi.fn();
vi.mock('../../src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: vi.fn(),
}));

vi.mock('../../src/store/slices/permissionsSlice', () => ({
  setPermissions: vi.fn(),
  resetPermissions: vi.fn(),
}));

const mockedResetPermissions = vi.mocked(resetPermissions);

const mockedAuthService = vi.mocked(authService);

const AuthConsumer = () => {
  const { isAuthenticated, isAuthResolved, isSessionVerified, user } =
    useAuth();

  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="resolved">{String(isAuthResolved)}</span>
      <span data-testid="verified">{String(isSessionVerified)}</span>
      <span data-testid="permissions">{user?.permisos?.join(',') ?? ''}</span>
    </div>
  );
};

const RefreshConsumer = () => {
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return null;
};

const LogoutConsumer = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <span data-testid="user-name">{user?.name ?? 'null'}</span>
      <button data-testid="logout-btn" onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </div>
  );
};

const buildAuthenticatedUser = (name = 'Test User') => ({
  id: 'user-1',
  name,
  email: 'test@example.com',
  rol: 'ADMIN' as const,
  permisos: ['usuarios:listar'],
  idioma: 'es' as const,
});

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('bootstraps the session from backend and ignores legacy stored permissions', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'user-1',
        name: 'Tampered User',
        email: 'tampered@example.com',
        rol: 'ADMIN',
        permisos: ['usuarios:eliminar'],
        idioma: 'es',
      })
    );

    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Valid User',
      email: 'valid@example.com',
      rol: 'ADMIN',
      permisos: ['usuarios:listar'],
      idioma: 'es',
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('verified')).toHaveTextContent('true');
      expect(screen.getByTestId('permissions')).toHaveTextContent(
        'usuarios:listar'
      );
    });
  });

  it('clears stored session when backend rejects the cookie session', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'user-1',
        name: 'Stale User',
        email: 'stale@example.com',
        rol: 'ADMIN',
        permisos: ['usuarios:listar'],
        idioma: 'es',
      })
    );
    mockedAuthService.getCurrentUser.mockRejectedValue(
      new Error('Unauthorized')
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('verified')).toHaveTextContent('false');
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  it('deduplicates concurrent refreshes against the current user endpoint', async () => {
    let releaseRequest: () => void = () => undefined;

    mockedAuthService.getCurrentUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRequest = () =>
            resolve({
              id: 'user-1',
              name: 'Valid User',
              email: 'valid@example.com',
              rol: 'ADMIN',
              permisos: ['usuarios:listar'],
              idioma: 'es',
            });
        })
    );

    render(
      <AuthProvider>
        <RefreshConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    releaseRequest();

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Tests de seguridad: logout ─────────────────────────────────────────────

  describe('logout', () => {
    it('debe llamar setUser(null) antes de resolver la promesa del servidor', async () => {
      let releaseLogout: () => void = () => {};

      mockedAuthService.getCurrentUser.mockResolvedValue(
        buildAuthenticatedUser()
      );
      mockedAuthService.logout.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            releaseLogout = resolve;
          })
      );

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('null');
      });

      releaseLogout();
    });

    it('debe limpiar el estado del usuario aunque el servidor falle', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(
        buildAuthenticatedUser()
      );
      mockedAuthService.logout.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('null');
      });
    });

    it('debe resetear los permisos Redux al hacer logout', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(
        buildAuthenticatedUser()
      );
      mockedAuthService.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      mockDispatch.mockClear();
      mockedResetPermissions.mockClear();

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('null');
      });

      expect(mockedResetPermissions).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('no debe dejar datos del usuario previo tras logout exitoso', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(
        buildAuthenticatedUser()
      );
      mockedAuthService.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('null');
      });

      expect(localStorage.getItem('sm_has_session')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('no debe dejar datos del usuario previo aunque el servidor devuelva 500', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(
        buildAuthenticatedUser()
      );
      mockedAuthService.logout.mockRejectedValue({
        status: 500,
        message: 'Internal Server Error',
      });

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('null');
      });

      expect(localStorage.getItem('sm_has_session')).toBeNull();
    });
  });

  // ─── Tests existentes ────────────────────────────────────────────────────────

  it('keeps protected session resolved during visibility background refresh', async () => {
    let releaseBackgroundRequest: (() => void) | null = null;

    mockedAuthService.getCurrentUser
      .mockResolvedValueOnce({
        id: 'user-1',
        name: 'Valid User',
        email: 'valid@example.com',
        rol: 'ADMIN',
        permisos: ['usuarios:listar'],
        idioma: 'es',
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseBackgroundRequest = () =>
              resolve({
                id: 'user-1',
                name: 'Valid User',
                email: 'valid@example.com',
                rol: 'ADMIN',
                permisos: ['usuarios:listar'],
                idioma: 'es',
              });
          })
      );

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('resolved')).toHaveTextContent('true');
      expect(screen.getByTestId('verified')).toHaveTextContent('true');
    });

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('resolved')).toHaveTextContent('true');
    });

    expect(releaseBackgroundRequest).not.toBeNull();
    (releaseBackgroundRequest as (() => void) | null)?.();

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('true');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
  });
});
