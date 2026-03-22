import { useMemo, useState } from 'react';
import {
  MisPedidosStatusFilter,
  PedidosTabValue,
  PedidosViewMode,
} from '../types/pedidos-ui.types';

export function usePedidosFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<PedidosViewMode>('list');
  const [tabIndex, setTabIndex] = useState<PedidosTabValue>(0);
  const [misPedidosStatus, setMisPedidosStatus] =
    useState<MisPedidosStatusFilter>('pendientes');

  const isWeeklyTab = tabIndex === 1;
  const isBatchTab = tabIndex === 2;
  const isOwnOrdersTab = tabIndex === 0;

  return useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      viewMode,
      setViewMode,
      tabIndex,
      setTabIndex,
      misPedidosStatus,
      setMisPedidosStatus,
      isWeeklyTab,
      isBatchTab,
      isOwnOrdersTab,
    }),
    [
      searchTerm,
      viewMode,
      tabIndex,
      misPedidosStatus,
      isWeeklyTab,
      isBatchTab,
      isOwnOrdersTab,
    ]
  );
}
