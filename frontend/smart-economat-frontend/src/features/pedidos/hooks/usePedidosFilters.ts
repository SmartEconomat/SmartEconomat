import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MisPedidosStatusFilter,
  PedidosTabValue,
  PedidosViewMode,
} from '../types/pedidos-ui.types';

const isPedidosTabValue = (value: unknown): value is PedidosTabValue =>
  value === 0 || value === 1 || value === 2;

const isPedidosViewMode = (value: unknown): value is PedidosViewMode =>
  value === 'list' || value === 'grid';

const isMisPedidosStatusFilter = (
  value: unknown
): value is MisPedidosStatusFilter =>
  value === 'pendientes' || value === 'activos' || value === 'finalizados';

/**
 * Ejecuta la lógica de use pedidos filters dentro del flujo de la aplicación.
 */
/**
 * Expone "usePedidosFilters" en smart-economat-frontend (SPA).
 * @undefined {{ searchTerm: string; setSearchTerm: (value: string) => void; viewMode: PedidosViewMode; setViewMode: (mode: PedidosViewMode) => void; tabIndex: PedidosTabValue; setTabIndex: (value: PedidosTabValue) => void; misPedidosStatus: MisPedidosStatusFilter; setMisPedidosStatus: (value: MisPedidosStatusFilter) => void; isWeeklyTab: boolean; isBatchTab: boolean; isOwnOrdersTab: boolean; }} Datos efectivos después de ejecutar la operación.
 */
export function usePedidosFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('search')?.trim() || '';
  const rawViewMode = searchParams.get('view');
  const viewMode = isPedidosViewMode(rawViewMode) ? rawViewMode : 'list';
  const rawTabIndex = Number(searchParams.get('tab'));
  const tabIndex = isPedidosTabValue(rawTabIndex) ? rawTabIndex : 0;
  const rawOwnStatus = searchParams.get('ownStatus');
  const misPedidosStatus = isMisPedidosStatusFilter(rawOwnStatus)
    ? rawOwnStatus
    : 'pendientes';

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          mutate(nextParams);
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setSearchTerm = useCallback(
    (value: string) => {
      updateParams((params) => {
        const normalizedValue = value.trim();

        if (normalizedValue) {
          params.set('search', normalizedValue);
        } else {
          params.delete('search');
        }
      });
    },
    [updateParams]
  );

  const setViewMode = useCallback(
    (mode: PedidosViewMode) => {
      updateParams((params) => {
        if (mode === 'list') {
          params.delete('view');
        } else {
          params.set('view', mode);
        }
      });
    },
    [updateParams]
  );

  const setTabIndex = useCallback(
    (value: PedidosTabValue) => {
      updateParams((params) => {
        if (value === 0) {
          params.delete('tab');
        } else {
          params.set('tab', String(value));
        }
      });
    },
    [updateParams]
  );

  const setMisPedidosStatus = useCallback(
    (value: MisPedidosStatusFilter) => {
      updateParams((params) => {
        if (value === 'pendientes') {
          params.delete('ownStatus');
        } else {
          params.set('ownStatus', value);
        }
      });
    },
    [updateParams]
  );

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
    ]
  );
}
