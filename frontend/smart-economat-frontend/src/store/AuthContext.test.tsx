import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth.hooks';
import { authService } from '../services/auth.service';

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

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

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
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
      })
    );

    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Valid User',
      email: 'valid@example.com',
      rol: 'ADMIN',
      permisos: ['usuarios:listar'],
    });

    render(
      <Provider store={store}>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </Provider>
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
      })
    );
    mockedAuthService.getCurrentUser.mockRejectedValue(
      new Error('Unauthorized')
    );

    render(
      <Provider store={store}>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
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
            });
        })
    );

    render(
      <Provider store={store}>
        <AuthProvider>
          <RefreshConsumer />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    releaseRequest();

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  it('skips auth bootstrap on login route when there is no session hint', async () => {
    window.history.replaceState({}, '', '/login');

    render(
      <Provider store={store}>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('true');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    expect(mockedAuthService.getCurrentUser).not.toHaveBeenCalled();
  });
});
