import { createContext } from 'react';

/** Contrato de tipos público (SidebarContextType). Contexto: smart-economat-frontend (SPA). */
export interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
}

/** Constantes públicas (SidebarContext) expuestas en smart-economat-frontend (SPA). */
export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);
