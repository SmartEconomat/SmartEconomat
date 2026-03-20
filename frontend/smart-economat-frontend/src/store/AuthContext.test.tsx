import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth.hooks';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

const createToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

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

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('verifies the token with backend and replaces tampered stored permissions', async () => {
    localStorage.setItem('token', createToken({ exp: 9999999999 }));
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
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('false');

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('verified')).toHaveTextContent('true');
      expect(screen.getByTestId('permissions')).toHaveTextContent(
        'usuarios:listar'
      );
    });
  });

  it('logs out when backend rejects the stored token', async () => {
    localStorage.setItem('token', createToken({ exp: 9999999999 }));
    mockedAuthService.getCurrentUser.mockRejectedValue(
      new Error('Unauthorized')
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('verified')).toHaveTextContent('false');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
