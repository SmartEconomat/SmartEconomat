import { createContext } from 'react';
import { ToastContextType } from './toast.types';

/** Constantes públicas (ToastContext) expuestas en smart-economat-frontend (SPA). */
export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
