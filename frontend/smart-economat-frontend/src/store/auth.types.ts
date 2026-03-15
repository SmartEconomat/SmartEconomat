export interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
  username?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}
