import React, { useState, ReactNode, useEffect } from 'react';
import i18n from '../i18n';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { authService } from '../services/auth.service';
import { ApiError } from '../services/api.service';

import { useAppDispatch } from '../store/hooks';
import {
  setPermissions,
  resetPermissions,
} from '../store/slices/permissionsSlice';
import { AuthContext } from './context';
import type { User } from './types';

const clearPersistedSessionArtifacts = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const isPublicAuthPath = (pathname: string) =>
  pathname === '/login' ||
  pathname === '/reset-password' ||
  pathname.startsWith('/reset-password/');

/**
 * Expone "AuthProvider" en smart-economat-frontend (SPA).
 * @undefined {{ children: ReactNode; }} {
 *   children,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const refreshPromiseRef = React.useRef<Promise<User | null> | null>(null);
  const dispatch = useAppDispatch();

  const isUnauthorizedError = React.useCallback((error: unknown): boolean => {
    if (error instanceof ApiError) {
      return error.status === 401;
    }

    if (error instanceof Error) {
      return /unauthorized|no autorizad|sesi[oó]n expirada/i.test(
        error.message
      );
    }

    return false;
  }, []);

  const refreshUser = React.useCallback(
    async (options?: { background?: boolean }) => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      const isBackgroundRefresh = options?.background === true;
      if (!isBackgroundRefresh) {
        setIsAuthResolved(false);
      }

      const refreshPromise = authService
        .getCurrentUser()
        .then((refreshedUser) => {
          setUser(refreshedUser);
          if (refreshedUser?.permisos) {
            dispatch(setPermissions(refreshedUser.permisos));
          } else {
            dispatch(resetPermissions());
          }

          // Sync i18n with user preferred language from DB
          if (refreshedUser?.idioma && i18n.language !== refreshedUser.idioma) {
            void i18n.changeLanguage(refreshedUser.idioma);
          }

          setIsSessionVerified(true);
          setIsAuthResolved(true);
          localStorage.setItem('sm_has_session', 'true');

          return refreshedUser;
        })
        .catch((error: unknown) => {
          if (isUnauthorizedError(error)) {
            clearPersistedSessionArtifacts();
            setIsSessionVerified(false);
            localStorage.removeItem('sm_has_session');
            setUser(null);
          }
          setIsAuthResolved(true);
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });

      refreshPromiseRef.current = refreshPromise;

      return refreshPromise;
    },
    [dispatch, isUnauthorizedError]
  );

  const changeLanguage = React.useCallback(
    async (idioma: 'es' | 'en') => {
      // 1. Immediate UI update
      await i18n.changeLanguage(idioma);

      // 2. Persist in DB if logged in
      if (user) {
        try {
          await authService.updateLanguage(idioma);
          // 3. Update local state
          setUser((prev) => (prev ? { ...prev, idioma } : null));
        } catch (error) {
          console.error('Failed to persist language in DB:', error);
        }
      }
    },
    [user]
  );

  const updateUser = React.useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const logout = React.useCallback(async () => {
    refreshPromiseRef.current = null;
    clearPersistedSessionArtifacts();
    setIsSessionVerified(false);
    setIsAuthResolved(true);
    localStorage.removeItem('sm_has_session');
    try {
      await authService.logout();
    } catch {
      return;
    }
  }, []);

  const login = React.useCallback(
    async (userData: User) => {
      refreshPromiseRef.current = null;
      clearPersistedSessionArtifacts();
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
        void refreshUser({ background: true });
      }
    };

    const handleRefreshUser = () => {
      void refreshUser({ background: true });
    };

    eventBus.on(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    eventBus.on(AUTH_EVENTS.REFRESH_USER, handleRefreshUser);

    document.addEventListener('visibilitychange', handleFocus);

    const SYNC_INTERVAL = 5 * 60 * 1000;
    let syncTimer: ReturnType<typeof setInterval>;

    if (isSessionVerified) {
      syncTimer = setInterval(() => {
        void refreshUser({ background: true });
      }, SYNC_INTERVAL);
    }

    return () => {
      eventBus.off(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
      eventBus.off(AUTH_EVENTS.REFRESH_USER, handleRefreshUser);
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
        updateUser,
        changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
