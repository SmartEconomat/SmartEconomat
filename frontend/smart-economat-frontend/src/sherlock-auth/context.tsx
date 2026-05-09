import { createContext } from 'react';
import type { AuthContextType } from './types';

/** Constantes públicas (AuthContext) expuestas en smart-economat-frontend (SPA). */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
