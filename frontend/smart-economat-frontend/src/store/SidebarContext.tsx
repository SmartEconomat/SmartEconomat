import React, { useState, useCallback, ReactNode, useEffect } from 'react';
import { useBreakpoints } from '../utils/useBreakpoints';
import { SidebarContext } from './sidebar.context';

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isLargeDesktop, isXLarge, isTablet, isDesktop } = useBreakpoints();
  const isDesktopMode = isLargeDesktop || isXLarge;

  const [isExpanded, setIsExpanded] = useState(isDesktopMode);

  // Sincronizar con cambios en breakpoints si no ha sido modificado manualmente
  // o simplemente seguir la lógica de MainLayout original
  useEffect(() => {
    if (isDesktopMode) {
      setIsExpanded(true);
    } else if (isTablet || isDesktop) {
      setIsExpanded(false);
    }
  }, [isDesktopMode, isTablet, isDesktop]);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
