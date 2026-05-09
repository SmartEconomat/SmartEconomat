import { useState, useCallback, useEffect, useMemo } from 'react';
import { SelectChangeEvent } from '@mui/material';
import type { PaginatedData } from '../services/api.service';

export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;
export type SortDirection = 'asc' | 'desc';
export type SortType = 'string' | 'number' | 'date';

/** Contrato de tipos público (DataTablePaginationProps). Contexto: smart-economat-frontend (SPA). */
export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (event: SelectChangeEvent<number>) => void;
  pageSizeOptions?: number[];
}

/** Contrato de tipos público (DataTableState). Contexto: smart-economat-frontend (SPA). */
export interface DataTableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  order: SortDirection;
  filters: Record<string, FilterValue>;
  searchTerm: string;
  totalItems: number;
}

/** Contrato de tipos público (SortConfig). Contexto: smart-economat-frontend (SPA). */
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

type PaginatedLike<T = unknown> = Partial<PaginatedData<T>> & {
  data?: T[];
};

/**
 * Expone "useDataTable" en smart-economat-frontend (SPA).
 * @undefined {Partial<DataTableState>} initialState - Entrada efectiva esperada por el contrato.
 * @undefined {{ debouncedFilters: Record<string, FilterValue>; debouncedSearchTerm: string; onPageChange: (_event: React.ChangeEvent<unknown> | null, newPage: number) => void; onPageSizeChange: (event: SelectChangeEvent<number>) => void; onSort: (key: string) => void; onFilter: (key: string, value: FilterValue) => void; onSearchChange: (value: string) => void; onTotalItemsChange: (total: number) => void; resetFilters: () => void; queryParams: Record<string, unknown>; paginationProps: { currentPage: number; pageSize: number; totalItems: number; totalPages: number; onPageChange: (_event: React.ChangeEvent<unknown> | null, newPage: number) => void; onPageSizeChange: (event: SelectChangeEvent<number>) => void; }; sortConfig: { key: string; direction: "asc" | "desc"; } | undefined; page: number; pageSize: number; sortBy?: string; order: "asc" | "desc"; filters: Record<string, FilterValue>; searchTerm: string; totalItems: number; }} Datos efectivos después de ejecutar la operación.
 */
export function useDataTable(initialState: Partial<DataTableState> = {}) {
  const normalizedInitialOrder: SortDirection =
    initialState.order === 'desc' ? 'desc' : 'asc';

  const [state, setState] = useState<DataTableState>({
    page: 1,
    pageSize: 10,
    sortBy: initialState.sortBy,
    order: normalizedInitialOrder,
    filters: initialState.filters || {},
    searchTerm: initialState.searchTerm || '',
    totalItems: initialState.totalItems || 0,
    ...initialState,
  });

  const [debouncedFilters, setDebouncedFilters] = useState(state.filters);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    state.searchTerm
  );

  // Debounce para filtros y searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(state.filters);
      setDebouncedSearchTerm(state.searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [state.filters, state.searchTerm]);

  const onPageChange = useCallback(
    (_event: React.ChangeEvent<unknown> | null, newPage: number) => {
      setState((prev) => ({ ...prev, page: newPage }));
    },
    []
  );

  const onPageSizeChange = useCallback((event: SelectChangeEvent<number>) => {
    setState((prev) => ({
      ...prev,
      pageSize: Number(event.target.value),
      page: 1,
    }));
  }, []);

  const onSort = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      sortBy: key,
      order: prev.sortBy === key && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const onFilter = useCallback((key: string, value: FilterValue) => {
    setState((prev) => ({
      ...prev,
      page: 1,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchTerm: value, page: 1 }));
  }, []);

  const onTotalItemsChange = useCallback((total: number) => {
    setState((prev) => ({ ...prev, totalItems: total }));
  }, []);

  const syncPaginationFromResponse = useCallback(
    <T>(payload: PaginatedLike<T>) => {
      const safeTotal =
        typeof payload.total === 'number'
          ? payload.total
          : Array.isArray(payload.data)
            ? payload.data.length
            : 0;

      setState((prev) => {
        const nextPage =
          typeof payload.page === 'number' && payload.page > 0
            ? payload.page
            : prev.page;
        const nextPageSize =
          typeof payload.limit === 'number' && payload.limit > 0
            ? payload.limit
            : prev.pageSize;

        return {
          ...prev,
          totalItems: safeTotal,
          page: nextPage,
          pageSize: nextPageSize,
        };
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {}, searchTerm: '', page: 1 }));
  }, []);

  const paginationProps = useMemo((): DataTablePaginationProps => {
    const totalPages = Math.ceil(state.totalItems / state.pageSize) || 1;
    return {
      currentPage: state.page,
      pageSize: state.pageSize,
      totalItems: state.totalItems,
      totalPages,
      onPageChange,
      onPageSizeChange,
    };
  }, [
    state.page,
    state.pageSize,
    state.totalItems,
    onPageChange,
    onPageSizeChange,
  ]);

  const queryParams = useMemo(() => {
    type QueryParams = {
      page: number;
      limit: number;
      sortBy?: string;
      order: SortDirection;
      search: string;
      searchTerm: string;
    } & Record<string, FilterValue>;

    const params: QueryParams = {
      page: Math.max(1, state.page),
      limit: state.pageSize,
      sortBy: state.sortBy,
      order: state.order,
      search: debouncedSearchTerm,
      searchTerm: debouncedSearchTerm, // Retrocompatibilidad
    };

    // Flatten filters into params
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Mapeo automático de nombres y mantenimiento de alias
        if (key === 'searchTerm' || key === 'search') {
          params.search = String(value);
          params.searchTerm = String(value);
        } else if (key === 'estado' || key === 'status') {
          const normalized = String(value);
          params.status = normalized;
          params.estado = normalized;
        } else if (
          key === 'fechaDesde' ||
          key === 'startDate' ||
          key === 'dateFrom'
        ) {
          const normalized = String(value);
          params.dateFrom = normalized;
          params.startDate = normalized;
          params.fechaDesde = normalized;
        } else if (
          key === 'fechaHasta' ||
          key === 'endDate' ||
          key === 'dateTo'
        ) {
          const normalized = String(value);
          params.dateTo = normalized;
          params.endDate = normalized;
          params.fechaHasta = normalized;
        } else {
          params[key] = value as FilterValue;
        }
      }
    });

    return params;
  }, [
    state.page,
    state.pageSize,
    state.sortBy,
    state.order,
    debouncedSearchTerm,
    debouncedFilters,
  ]);

  return {
    ...state,
    debouncedFilters,
    debouncedSearchTerm,
    onPageChange,
    onPageSizeChange,
    onSort,
    onFilter,
    onSearchChange,
    onTotalItemsChange,
    syncPaginationFromResponse,
    resetFilters,
    queryParams,
    paginationProps,
    sortConfig: state.sortBy
      ? {
          key: state.sortBy,
          direction: state.order,
        }
      : undefined,
  };
}
