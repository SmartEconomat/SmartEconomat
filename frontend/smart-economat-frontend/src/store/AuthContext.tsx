import React, { useState, ReactNode, useEffect } from 'react';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';
import { User } from './auth.types';
import { AuthContext } from './auth.context';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = React.useCallback((userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

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
      value={{ isAuthenticated: !!user, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
