import React, { useState, ReactNode, useEffect } from 'react';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { User } from './auth.types';
import { AuthContext } from './auth.context';
import { authService } from '../services/authService';

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

  const login = React.useCallback((userData: User) => {
    refreshPromiseRef.current = null;
    clearLegacySessionStorage();
    setUser(userData);
    setIsSessionVerified(true);
    setIsAuthResolved(true);
  }, []);

  const logout = React.useCallback(async () => {
    refreshPromiseRef.current = null;
    clearLegacySessionStorage();
    setUser(null);
    setIsSessionVerified(false);
    setIsAuthResolved(true);
    try {
      await authService.logout();
    } catch {
      return;
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setIsAuthResolved(false);

    const refreshPromise = authService
      .getCurrentUser()
      .then((refreshedUser) => {
        setUser(refreshedUser);
        setIsSessionVerified(true);
        setIsAuthResolved(true);
        return refreshedUser;
      })
      .catch(() => {
        clearLegacySessionStorage();
        setUser(null);
        setIsSessionVerified(false);
        setIsAuthResolved(true);
        return null;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    refreshPromiseRef.current = refreshPromise;

    return refreshPromise;
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      void logout();
    };

    eventBus.on(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    return () => {
      eventBus.off(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    };
  }, [logout]);

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
