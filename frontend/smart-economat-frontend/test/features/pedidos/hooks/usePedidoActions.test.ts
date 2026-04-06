import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { usePedidoActions } from '../../../../src/features/pedidos/hooks/usePedidoActions';
import * as pedidoService from '../../../../src/services/pedido.service';
import { saveRecepcionDraft } from '../../../../src/services/recepcionDraft.service';
import {
  EstadoLote,
  EstadoPedido,
  EstadoPedidoUsuario,
} from '../../../../src/services/pedido.types';

vi.mock('../../../../src/services/pedido.service');
vi.mock('../../../../src/services/recepcionDraft.service', () => ({
  saveRecepcionDraft: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../src/store/toast.hooks', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('usePedidoActions', () => {
  const reload = vi.fn().mockResolvedValue(undefined);
  const discardDraft = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    reload.mockResolvedValue(undefined);
    discardDraft.mockResolvedValue(undefined);
    vi.mocked(pedidoService.updatePurchaseBatch).mockResolvedValue({
      id: 'batch-1',
      createdAt: '2026-04-01T10:00:00.000Z',
      estado: EstadoLote.PENDIENTE,
      pedidos: [],
    } as Awaited<ReturnType<typeof pedidoService.updatePurchaseBatch>>);
    vi.mocked(pedidoService.updatePedidoUsuario).mockResolvedValue({
      id: 'pedido-usuario-1',
      numeroGlobal: '42',
      fechaPedido: '2026-04-01T10:00:00.000Z',
      costeTotal: 10,
      estado: EstadoPedidoUsuario.PENDIENTE,
      pedidos: [],
    } as Awaited<ReturnType<typeof pedidoService.updatePedidoUsuario>>);
  });

  it('edita una purchase_batch usando el endpoint de compra y no el de pedido_usuario', async () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(MemoryRouter, undefined, children);

    const { result } = renderHook(
      () =>
        usePedidoActions({
          reload,
          discardDraft,
        }),
      { wrapper }
    );

    await result.current.savePedido({
      id: 'batch-1',
      targetType: 'purchase_batch',
      observaciones: 'Compra semanal',
      pedidoProductos: [
        {
          id: 'linea-1',
          productoProveedorId: 'pp-1',
          cantidad: 3,
          productoProveedor: {
            proveedor: { id: 'prov-1' },
          },
        },
      ],
    });

    await waitFor(() => {
      expect(pedidoService.updatePurchaseBatch).toHaveBeenCalledWith(
        'batch-1',
        {
          observaciones: 'Compra semanal',
          lineas: [
            {
              id: 'linea-1',
              productoProveedorId: 'pp-1',
              cantidad: 3,
            },
          ],
        }
      );
    });

    expect(pedidoService.updatePedidoUsuario).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('devuelve el detalle discriminado al cargar una compra', async () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(MemoryRouter, undefined, children);

    vi.mocked(pedidoService.fetchPurchaseBatchById).mockResolvedValue({
      id: 'batch-9',
      createdAt: '2026-04-01T10:00:00.000Z',
      estado: EstadoLote.PENDIENTE,
      pedidos: [],
    } as Awaited<ReturnType<typeof pedidoService.fetchPurchaseBatchById>>);

    const { result } = renderHook(
      () =>
        usePedidoActions({
          reload,
          discardDraft,
        }),
      { wrapper }
    );

    await expect(
      result.current.fetchBatchDetail('batch-9', 'purchase_batch')
    ).resolves.toMatchObject({
      entityType: 'purchase_batch',
      data: {
        id: 'batch-9',
      },
    });
  });

  it('inicia la recepción desde compra navegando a la ruta final con auto-reanudación', async () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(MemoryRouter, undefined, children);

    const batch = {
      id: 'batch-10',
      createdAt: '2026-04-01T10:00:00.000Z',
      estado: EstadoLote.PARCIAL,
      pedidos: [
        {
          id: 'pedido-1',
          numeroGlobal: '100',
          fechaPedido: '2026-04-01T09:00:00.000Z',
          estado: EstadoPedido.POR_RECEPCIONAR,
          costeTotal: 15,
          proveedor: {
            id: 'prov-1',
            nombre: 'Proveedor test',
          },
          pedidoProductos: [],
        },
      ],
    };

    const { result } = renderHook(
      () =>
        usePedidoActions({
          reload,
          discardDraft,
        }),
      { wrapper }
    );

    await result.current.startRecepcionFromBatch(batch);

    await waitFor(() => {
      expect(saveRecepcionDraft).toHaveBeenCalledTimes(1);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/recepciones', {
      state: {
        autoResumeRecepcionDraft: true,
      },
    });
  });
});
