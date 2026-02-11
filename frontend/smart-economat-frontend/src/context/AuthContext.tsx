import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User, LoginRequest } from "../types/auth.types";
import * as authService from "../services/auth.service";

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  authError: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const response = await authService.login(data);

      setUser(response.user);
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
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, authError, login, logout }}
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
