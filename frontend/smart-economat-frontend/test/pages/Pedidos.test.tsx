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
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mocking hooks and components
vi.mock('../../src/hooks/usePedidoDraft');
vi.mock('../../src/store/auth.hooks');
vi.mock('../../src/services/pedido.service');
vi.mock('../../src/services/proveedor.service');
vi.mock('../../src/services/productoProveedor.service');
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
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
    vi.mocked(pedidoService.fetchPedidos).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 10,
    } as unknown as ReturnType<
      typeof pedidoService.fetchPedidos
    > extends Promise<infer R>
      ? R
      : never);
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

    // Override the mock to return our local state
    vi.mocked(pedidoDraftHook.usePedidoDraft).mockReturnValue({
      draft,
      loadDraft: () => {
        mockLoadDraft();
        return Promise.resolve();
      },
      saveDraft: (payload: Record<string, unknown>) => {
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
      },
      discardDraft: mockDiscardDraft,
      isLoadingDraft,
      flushSave: mockFlushSave,
    } as unknown as ReturnType<typeof pedidoDraftHook.usePedidoDraft>);

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
      screen.queryByText('Recuperar Pedido Pendiente')
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
      screen.queryByText('Recuperar Pedido Pendiente')
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
        screen.getByText('Recuperar Pedido Pendiente')
      ).toBeInTheDocument();
    });
  });
});
