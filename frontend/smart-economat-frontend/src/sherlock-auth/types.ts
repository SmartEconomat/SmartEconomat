export interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
  username?: string;
  permisos?: string[];
  slotId?: string;
  ubicacionId?: string;
  alumno?: {
    id: string;
    slot?: {
      id: string;
      aula: string;
      ubicacion?: {
        id: string;
        nombre: string;
      };
    };
  };
  profesor?: {
    id: string;
    slots?: Array<{
      id: string;
      aula: string;
      ubicacion?: {
        id: string;
        nombre: string;
      };
    }>;
  };
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
