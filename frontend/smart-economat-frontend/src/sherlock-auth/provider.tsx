import React, { useState, ReactNode, useEffect } from 'react';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { authService } from '../services/auth.service';
import { tokenManager } from '../utils/token.manager';

import { useAppDispatch } from '../store/hooks';
import {
  setPermissions,
  resetPermissions,
} from '../store/slices/permissionsSlice';
import { AuthContext } from './context';
import type { User } from './types';

const clearLegacySessionStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  tokenManager.clearToken();
};

const isPublicAuthPath = (pathname: string) =>
  pathname === '/login' ||
  pathname === '/reset-password' ||
  pathname.startsWith('/reset-password/');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const refreshPromiseRef = React.useRef<Promise<User | null> | null>(null);
  const dispatch = useAppDispatch();

  const refreshUser = React.useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setIsAuthResolved(false);

    const refreshPromise = authService
      .getCurrentUser()
      .then((refreshedUser) => {
        setUser(refreshedUser);
        if (refreshedUser?.permisos) {
          dispatch(setPermissions(refreshedUser.permisos));
        } else {
          dispatch(resetPermissions());
        }
        setIsSessionVerified(true);
        setIsAuthResolved(true);
        localStorage.setItem('sm_has_session', 'true');

        return refreshedUser;
      })
      .catch(() => {
        clearLegacySessionStorage();
        setIsSessionVerified(false);
        setIsAuthResolved(true);
        localStorage.removeItem('sm_has_session');
        setUser(null);
        // No resetear permisos aquí para evitar navegación inesperada en vistas protegidas
        // dispatch(resetPermissions()); // Comentado para preservar permisos hasta logout
        return null;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    refreshPromiseRef.current = refreshPromise;

    return refreshPromise;
  }, [dispatch]);

  const logout = React.useCallback(async () => {
    refreshPromiseRef.current = null;
    clearLegacySessionStorage();
    setIsSessionVerified(false);
    setIsAuthResolved(true);
    localStorage.removeItem('sm_has_session');
    tokenManager.clearToken();
    try {
      await authService.logout();
    } catch {
      return;
    }
  }, []);

  const login = React.useCallback(
    async (userData: User) => {
      refreshPromiseRef.current = null;
      clearLegacySessionStorage();
      setUser(userData);
      setIsSessionVerified(true);
      localStorage.setItem('sm_has_session', 'true');
      setIsAuthResolved(false);

      try {
        await refreshUser();
      } catch (error) {
        console.error('Error refreshing user after login:', error);
        setIsAuthResolved(true);
      }
    },
    [refreshUser]
  );

  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasSessionHint = localStorage.getItem('sm_has_session') === 'true';
    const shouldBootstrapSession =
      !isPublicAuthPath(currentPath) || hasSessionHint;

    if (shouldBootstrapSession) {
      void refreshUser();
    } else {
      setIsAuthResolved(true);
    }
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      void logout();
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible' && isSessionVerified) {
        void refreshUser();
      }
    };

    eventBus.on(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    eventBus.on(AUTH_EVENTS.REFRESH_USER, refreshUser);

    document.addEventListener('visibilitychange', handleFocus);

    const SYNC_INTERVAL = 5 * 60 * 1000;
    let syncTimer: ReturnType<typeof setInterval>;

    if (isSessionVerified) {
      syncTimer = setInterval(() => {
        void refreshUser();
      }, SYNC_INTERVAL);
    }

    return () => {
      eventBus.off(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
      eventBus.off(AUTH_EVENTS.REFRESH_USER, refreshUser);
      document.removeEventListener('visibilitychange', handleFocus);
      if (syncTimer) clearInterval(syncTimer);
    };
  }, [logout, refreshUser, isSessionVerified]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user && isSessionVerified,
        isAuthResolved,
        isSessionVerified,
        user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
