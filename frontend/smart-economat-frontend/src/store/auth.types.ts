export interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
  username?: string;
  permisos?: string[];
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isSessionVerified: boolean;
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}
