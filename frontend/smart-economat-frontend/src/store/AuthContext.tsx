import React, { useState, ReactNode, useEffect } from 'react';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { User } from './auth.types';
import { AuthContext } from './auth.context';
import { authService } from '../services/authService';
import { useAppDispatch } from './hooks';
import { setPermissions, resetPermissions } from './slices/permissionsSlice';

const clearLegacySessionStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

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
        return refreshedUser;
      })
      .catch(() => {
        clearLegacySessionStorage();
        setUser(null);
        dispatch(resetPermissions());
        setIsSessionVerified(false);
        setIsAuthResolved(true);
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
    setUser(null);
    dispatch(resetPermissions());
    setIsSessionVerified(false);
    setIsAuthResolved(true);
    try {
      await authService.logout();
    } catch {
      return;
    }
  }, [dispatch]);

  const login = React.useCallback(
    async (userData: User) => {
      refreshPromiseRef.current = null;
      clearLegacySessionStorage();
      setUser(userData);
      setIsSessionVerified(true);
      // No marcamos como resuelto aún, esperamos a tener el perfil completo
      setIsAuthResolved(false);

      try {
        await refreshUser();
      } catch (error) {
        console.error('Error refreshing user after login:', error);
        // Si falla el refresh detallado, al menos resolvemos con la data básica
        setIsAuthResolved(true);
      }
    },
    [refreshUser]
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      void logout();
    };

    const handleFocus = () => {
      // Sincronizar 'cuando sea necesario' (ej: al volver a la pestaña)
      // solo si ya estábamos autenticados para evitar spams innecesarios al inicio
      if (document.visibilityState === 'visible' && isSessionVerified) {
        void refreshUser();
      }
    };

    eventBus.on(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    eventBus.on(AUTH_EVENTS.REFRESH_USER, refreshUser);

    // Listener de visibilidad de página (sincronizar al volver)
    document.addEventListener('visibilitychange', handleFocus);

    // Sincronizar backend y frontend cada X tiempo (ej: 5 minutos)
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
