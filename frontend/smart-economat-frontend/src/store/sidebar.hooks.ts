import { useContext } from 'react';
import { SidebarContext } from './sidebar.context';

/**
 * Expone "useSidebar" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/store/sidebar.context").SidebarContextType} Datos efectivos después de ejecutar la operación.
 */
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
