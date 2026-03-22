import { useMemo, useState } from 'react';
import { PedidosTabValue, PedidosViewMode } from '../types/pedidos-ui.types';

export function usePedidosFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<PedidosViewMode>('list');
  const [tabIndex, setTabIndex] = useState<PedidosTabValue>(0);

  const isBatchTab = tabIndex === 2;
  const isPendingTab = tabIndex === 0;

  return useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      viewMode,
      setViewMode,
      tabIndex,
      setTabIndex,
      isBatchTab,
      isPendingTab,
    }),
    [searchTerm, viewMode, tabIndex, isBatchTab, isPendingTab]
  );
}
