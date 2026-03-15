import { createContext } from 'react';
import { ToastContextType } from './toast.types';

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
