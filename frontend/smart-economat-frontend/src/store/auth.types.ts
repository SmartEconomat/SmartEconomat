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
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}
