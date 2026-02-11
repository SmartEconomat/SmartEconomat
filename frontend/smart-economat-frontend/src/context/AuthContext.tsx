import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { User ,LoginRequest } from "../types/auth.types";
import * as authService from "../services/auth.service";

interface AuthContextProps {
  username?: string;
  token: string | null;
  isLoading: boolean;
  authError: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem("token");
    return storedToken ? JSON.parse(storedToken) : null;
  });
  const [username, setUsername] = useState<string | null>(() => {
    const storedUsername = localStorage.getItem("username");
    return storedUsername ? JSON.parse(storedUsername) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const response = await authService.login(data);

      setToken(response.token);

      localStorage.setItem("token", response.token);
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };
  useEffect(() => {
    if (!token) {
      setToken(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        isLoading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
