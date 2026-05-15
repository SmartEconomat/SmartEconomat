import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MermasPage from '../../src/pages/Mermas';
import * as mermaService from '../../src/services/merma.service';
import * as authHooks from '../../src/store/auth.hooks';
import * as toastHooks from '../../src/store/toast.hooks';
import * as dataTableHooks from '../../src/hooks/useDataTable';
import { MotivoMerma } from '../../src/services/merma.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../src/services/merma.service');
vi.mock('../../src/services/producto.service', () => ({
  fetchProductosPaginated: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
  }),
}));
vi.mock('../../src/store/auth.hooks');
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}));
vi.mock('../../src/hooks/useDataTable');
vi.mock('../../src/components/ui/PageToolbar', () => ({
  default: ({
    title,
    primaryAction,
  }: {
    title?: React.ReactNode;
    primaryAction?: { label: string; onClick: () => void };
  }) => (
    <div>
      <div>{title}</div>
      {primaryAction ? (
        <button onClick={primaryAction.onClick}>{primaryAction.label}</button>
      ) : null}
    </div>
  ),
}));
vi.mock('../../src/features/mermas', () => ({
  MermasTable: () => <div>mermas-table</div>,
  MermaStats: () => <div>mermas-stats</div>,
}));
vi.mock('../../src/components/ui/DynamicFormModal', () => ({
  default: () => null,
}));

const getDataTableMock = (
  filters: { motivo: string; startDate: string; endDate: string } = {
    motivo: '',
    startDate: '',
    endDate: '',
  }
) => ({
  filters,
  onSort: vi.fn(),
  onFilter: vi.fn(),
  queryParams: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc',
  },
  sortConfig: {
    field: 'createdAt',
    direction: 'desc',
  },
  paginationProps: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    onPageChange: vi.fn(),
    onRowsPerPageChange: vi.fn(),
  },
  syncPaginationFromResponse: vi.fn(),
});

describe('Mermas page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(toastHooks.useToast).mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    });

    vi.mocked(mermaService.fetchMermas).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 20,
    });

    vi.mocked(mermaService.fetchMermaStats).mockResolvedValue({
      porMotivo: [],
      porProducto: [],
    });

    vi.mocked(dataTableHooks.useDataTable).mockReturnValue(
      getDataTableMock() as never
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('oculta CTA y no consulta stats cuando falta permiso merma:stats/crear', async () => {
    vi.mocked(authHooks.usePermission).mockReturnValue(false);

    render(<MermasPage />);

    await waitFor(() => {
      expect(mermaService.fetchMermas).toHaveBeenCalled();
    });

    expect(mermaService.fetchMermaStats).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'mermas.acciones.registrar' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('mermas-stats')).not.toBeInTheDocument();
  });

  it('consulta stats con filtros de fecha y motivo cuando hay permiso', async () => {
    vi.mocked(authHooks.usePermission).mockReturnValue(true);
    vi.mocked(dataTableHooks.useDataTable).mockReturnValue(
      getDataTableMock({
        motivo: MotivoMerma.ROTURA,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }) as never
    );

    render(<MermasPage />);

    await waitFor(() => {
      expect(mermaService.fetchMermaStats).toHaveBeenCalledWith({
        motivo: MotivoMerma.ROTURA,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
    });

    expect(
      screen.getByRole('button', { name: 'mermas.acciones.registrar' })
    ).toBeInTheDocument();
    expect(screen.getByText('mermas-stats')).toBeInTheDocument();
  });
});
