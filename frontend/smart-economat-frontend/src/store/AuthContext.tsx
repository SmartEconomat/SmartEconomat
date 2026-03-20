import React, { useState, ReactNode, useEffect } from 'react';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { User } from './auth.types';
import { AuthContext } from './auth.context';
import { authService } from '../services/authService';
import { isJwtUsable } from '../utils/auth/jwtUtils';

const clearStoredSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return true;
    }

    if (!isJwtUsable(token)) {
      clearStoredSession();
      return true;
    }

    return false;
  });
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const login = React.useCallback((userData: User, token: string) => {
    if (!isJwtUsable(token)) {
      clearStoredSession();
      setUser(null);
      setIsSessionVerified(false);
      setIsAuthResolved(true);
      setVerifiedToken(null);
      return;
    }

    setUser(userData);
    setIsSessionVerified(true);
    setIsAuthResolved(true);
    setVerifiedToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    setIsSessionVerified(false);
    setIsAuthResolved(true);
    setVerifiedToken(null);
    clearStoredSession();
  }, []);

  const refreshUser = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !isJwtUsable(token)) {
      logout();
      return null;
    }

    setIsAuthResolved(false);

    try {
      const refreshedUser = await authService.getCurrentUser();
      setUser(refreshedUser);
      setIsSessionVerified(true);
      setIsAuthResolved(true);
      setVerifiedToken(token);
      localStorage.setItem('user', JSON.stringify(refreshedUser));
      return refreshedUser;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setIsSessionVerified(false);
      setIsAuthResolved(true);
      setVerifiedToken(null);
      localStorage.removeItem('user');
      return;
    }

    if (!isJwtUsable(token)) {
      logout();
      return;
    }

    void refreshUser();
  }, [logout, refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
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
        verifiedToken,
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
