import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Pedidos from '../../src/pages/Pedidos';
import * as pedidoDraftHook from '../../src/hooks/usePedidoDraft';
import * as authHooks from '../../src/store/auth.hooks';
import * as pedidoService from '../../src/services/pedido.service';
import * as proveedorService from '../../src/services/proveedor.service';
import * as productoProveedorService from '../../src/services/productoProveedor.service';
import { PedidoDraftRecord } from '../../src/services/pedidoDraft.service';
import type {
  PedidoListItem,
  PurchaseBatch,
} from '../../src/services/pedido.types';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../src/i18n';

/**
 * Los hooks pueden invocarse en cada render del componente. Si el mock crea nuevos arrays
 * u objetos en cada llamada (`data: [], batches: []`), las dependencias de los useEffect que
 * referencian `data`/`batches` (p. ej. syncPaginationFromResponse en Pedidos.tsx) cambian
 * en cada commit y provocan un bucle infinito: efecto → setState(useDataTable) → re-render
 * → mock nuevo reference → efecto → …
 *
 * Una sola instancia estable evita ese antipatrón típico de tests con páginas "smart".
 */
const stablePedidosMocks = vi.hoisted(() => {
  const data: PedidoListItem[] = [];
  const batches: PurchaseBatch[] = [];
  const pedidosReload = vi.fn();
  const pedidosSetData = vi.fn();

  const setSearchTerm = vi.fn();
  const setViewMode = vi.fn();
  const setTabIndex = vi.fn();
  const setMisPedidosStatus = vi.fn();

  const filtersReturn = Object.freeze({
    searchTerm: '',
    setSearchTerm,
    viewMode: 'table' as const,
    setViewMode,
    tabIndex: 0 as const,
    setTabIndex,
    misPedidosStatus: 'pendientes' as const,
    setMisPedidosStatus,
    isWeeklyTab: false as const,
    isBatchTab: false as const,
    isOwnOrdersTab: true as const,
  });

  const usePedidosDataReturn = Object.freeze({
    data,
    batches,
    isLoading: false as const,
    error: null as null,
    totalPages: 1,
    totalItems: 0,
    reload: pedidosReload,
    setData: pedidosSetData,
  });

  const usePedidoActionsReturn = Object.freeze({
    savePedido: vi.fn(),
    deletePedidoById: vi.fn(),
    approvePedidoById: vi.fn(),
    approvePurchaseBatchById: vi.fn(),
    cancelPedidoById: vi.fn(),
    cancelPurchaseBatchById: vi.fn(),
    fetchBatchDetail: vi.fn(),
    consolidatePedidosByIds: vi.fn(),
    startRecepcionFromBatch: vi.fn(),
    isSaving: false as const,
    isDeleting: false as const,
    isAceptando: false as const,
    isCancelando: false as const,
    isConsolidatingBatch: false as const,
  });

  return {
    filtersReturn,
    usePedidosDataReturn,
    usePedidoActionsReturn,
  };
});

// Mocking hooks and components
vi.mock('../../src/hooks/usePedidoDraft', () => ({
  usePedidoDraft: vi.fn(),
}));
vi.mock('../../src/store/auth.hooks', () => ({
  useAuth: vi.fn(),
  usePermission: vi.fn(),
  useAnyPermission: vi.fn(),
}));
vi.mock('../../src/services/pedido.service', () => ({
  fetchPedidos: vi.fn(),
  fetchPedidoUsuarios: vi.fn(),
  fetchPurchaseBatches: vi.fn(),
  mapPedidoUsuarioToVisibleRow: vi.fn((pedidoUsuario) => pedidoUsuario),
  aceptarPedidoUsuario: vi.fn(),
  aceptarPedido: vi.fn(),
  cancelPedidoUsuario: vi.fn(),
  cancelPedido: vi.fn(),
  consolidatePurchaseBatch: vi.fn(),
  createPedido: vi.fn(),
  createPedidoUsuario: vi.fn(),
  fetchPurchaseBatchById: vi.fn(),
  fetchPedidoUsuarioById: vi.fn(),
  updatePedidoUsuario: vi.fn(),
  updatePedido: vi.fn(),
  restaurarPedido: vi.fn(),
  restaurarPedidoUsuario: vi.fn(),
  restaurarPurchaseBatch: vi.fn(),
}));
vi.mock('../../src/services/proveedor.service', () => ({
  fetchProveedores: vi.fn(),
}));
vi.mock('../../src/services/productoProveedor.service', () => ({
  searchProductoProveedor: vi.fn(),
}));
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock('../../src/components/ui/ConfirmDialog', () => ({
  default: ({
    isOpen,
    title,
    onConfirm,
    onCancel,
  }: {
    isOpen?: boolean;
    title?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        <button onClick={() => onConfirm?.()}>confirm</button>
        <button onClick={() => onCancel?.()}>cancel</button>
      </div>
    ) : null,
}));
vi.mock('../../src/components/ui/DynamicFormModal', () => ({
  default: ({ isOpen }: { isOpen?: boolean }) =>
    isOpen ? <div>dynamic-form-open</div> : null,
}));
vi.mock('../../src/features/pedidos/components/PedidosPageHeader', () => ({
  default: ({
    onCreateClick,
    onContinueDraftClick,
    draft,
    onSearchChange,
  }: {
    onCreateClick: () => void;
    onContinueDraftClick: () => void;
    draft: PedidoDraftRecord | null;
    onSearchChange: (value: string) => void;
  }) => (
    <div>
      <button onClick={onCreateClick}>Nuevo Pedido</button>
      {draft ? (
        <button onClick={onContinueDraftClick}>Continuar Pedido</button>
      ) : null}
      <input
        aria-label="buscar pedidos"
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  ),
}));
vi.mock('../../src/features/pedidos/components/PedidosTabs', () => ({
  default: () => <div>pedidos-tabs</div>,
}));
vi.mock('../../src/features/pedidos/components/PedidosTable', () => ({
  default: () => <div>pedidos-table</div>,
}));
vi.mock('../../src/features/pedidos/components/PedidosWeeklyBoard', () => ({
  default: () => <div>pedidos-weekly-board</div>,
}));
vi.mock('../../src/features/pedidos/components/PurchasesWeeklyBoard', () => ({
  default: () => <div>purchases-weekly-board</div>,
}));
vi.mock(
  '../../src/features/pedidos/components/PurchaseBatchDetailModal',
  () => ({
    default: () => <div>purchase-batch-detail-modal</div>,
  })
);
vi.mock('../../src/features/pedidos/components/PedidoDetailDrawer', () => ({
  default: () => <div>pedido-detail-drawer</div>,
}));
vi.mock(
  '../../src/features/pedidos/components/PedidoDeliveryDateDialog',
  () => ({
    default: () => <div>pedido-delivery-date-dialog</div>,
  })
);
vi.mock('../../src/components/ui/ReporteSelectorModal', () => ({
  default: () => <div>reporte-selector-modal</div>,
}));
vi.mock('../../src/features/pedidos/components/PedidoDraftBanner', () => ({
  default: () => <div>pedido-draft-banner</div>,
}));
vi.mock('../../src/features/pedidos/hooks/usePedidosFilters', () => ({
  usePedidosFilters: vi.fn(() => stablePedidosMocks.filtersReturn),
}));
vi.mock('../../src/features/pedidos/hooks/usePedidosData', () => ({
  usePedidosData: vi.fn(() => stablePedidosMocks.usePedidosDataReturn),
}));
vi.mock('../../src/features/pedidos/hooks/usePedidoActions', () => ({
  usePedidoActions: vi.fn(() => stablePedidosMocks.usePedidoActionsReturn),
}));

describe('Pedidos Page - Recovery Modal Bug', () => {
  const mockDiscardDraft = vi.fn();
  const mockSaveDraft = vi.fn();
  const mockLoadDraft = vi.fn();
  const mockFlushSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for auth
    vi.mocked(authHooks.usePermission).mockReturnValue(true);
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
      },
    } as unknown as ReturnType<typeof authHooks.useAuth>);

    // Default mock for data fetching
    vi.mocked(pedidoService.fetchPedidoUsuarios).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 50,
    } as unknown as ReturnType<
      typeof pedidoService.fetchPedidoUsuarios
    > extends Promise<infer R>
      ? R
      : never);
    vi.mocked(pedidoService.fetchPurchaseBatches).mockResolvedValue([]);
    vi.mocked(proveedorService.fetchProveedores).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 50,
    } as unknown as ReturnType<
      typeof proveedorService.fetchProveedores
    > extends Promise<infer R>
      ? R
      : never);
    vi.mocked(
      productoProveedorService.searchProductoProveedor
    ).mockResolvedValue(
      [] as unknown as ReturnType<
        typeof productoProveedorService.searchProductoProveedor
      > extends Promise<infer R>
        ? R
        : never
    );
  });

  // Wrapper component to simulate hook state updates without remounting Pedidos
  const TestWrapper = () => {
    const [draft, setDraft] = React.useState<PedidoDraftRecord | null>(null);
    const isLoadingDraft = false;

    const loadDraft = React.useCallback(() => {
      mockLoadDraft();
      return Promise.resolve();
    }, []);

    const saveDraft = React.useCallback((payload: Record<string, unknown>) => {
      mockSaveDraft(payload);
      setDraft({
        id: 'new-draft',
        userId: 'user-1',
        version: 1,
        payload,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        expiresAt: null,
        source: 'redis',
      });
    }, []);

    const mockedDraftHook = React.useMemo(
      () =>
        ({
          draft,
          loadDraft,
          saveDraft,
          discardDraft: mockDiscardDraft,
          isLoadingDraft,
          flushSave: mockFlushSave,
        }) as unknown as ReturnType<typeof pedidoDraftHook.usePedidoDraft>,
      [draft, isLoadingDraft, loadDraft, saveDraft]
    );

    // Override the mock to return our local state
    vi.mocked(pedidoDraftHook.usePedidoDraft).mockReturnValue(mockedDraftHook);

    return (
      <MemoryRouter>
        <Pedidos />
      </MemoryRouter>
    );
  };

  it('no debería mostrar el modal de recuperación al crear un nuevo pedido y autoguardar un borrador', async () => {
    render(<TestWrapper />);

    // Esperar a que cargue
    await waitFor(() => expect(mockLoadDraft).toHaveBeenCalled());

    // 2. Click en Nuevo Pedido
    const btnNuevo = screen.getByText('Nuevo Pedido');
    fireEvent.click(btnNuevo);

    // El modal de recuperación NO debería estar
    expect(
      screen.queryByText(i18n.t('pedidos.recovery.titulo'))
    ).not.toBeInTheDocument();

    // 3. Simular que se guarda un borrador
    // Llamamos a saveDraft del mock (que está vinculado al estado del Wrapper)
    await act(async () => {
      vi.mocked(pedidoDraftHook.usePedidoDraft)().saveDraft({
        observaciones: 'Prueba',
      });
    });

    // El modal de recuperación NO debería haber aparecido porque hasPromptedRef.current es true
    // (Ya sea porque se puso a true al terminar la carga inicial sin draft, o al hacer click en Nuevo Pedido)
    expect(
      screen.queryByText(i18n.t('pedidos.recovery.titulo'))
    ).not.toBeInTheDocument();
  });

  it('debería mostrar el modal de recuperación si hay un borrador previo al cargar la página', async () => {
    // Simular que HAY un borrador inicial
    vi.mocked(pedidoDraftHook.usePedidoDraft).mockReturnValue({
      draft: {
        id: 'old-draft',
        userId: 'user-1',
        version: 1,
        payload: { observaciones: 'Pedido viejo' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        expiresAt: null,
        source: 'redis',
      },
      loadDraft: mockLoadDraft,
      saveDraft: mockSaveDraft,
      discardDraft: mockDiscardDraft,
      isLoadingDraft: false,
      flushSave: mockFlushSave,
    } as unknown as ReturnType<typeof pedidoDraftHook.usePedidoDraft>);

    render(
      <MemoryRouter>
        <Pedidos />
      </MemoryRouter>
    );

    // Esperar a que el modal aparezca
    await waitFor(() => {
      expect(
        screen.getByText(i18n.t('pedidos.recovery.titulo'))
      ).toBeInTheDocument();
    });
  });

  it('sincroniza la búsqueda de pedidos con filtros de URL', async () => {
    render(
      <MemoryRouter>
        <Pedidos />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockLoadDraft).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('buscar pedidos'), {
      target: { value: 'lentejas' },
    });

    await waitFor(() => {
      expect(stablePedidosMocks.filtersReturn.setSearchTerm).toHaveBeenCalledWith(
        'lentejas'
      );
    });
  });
});
