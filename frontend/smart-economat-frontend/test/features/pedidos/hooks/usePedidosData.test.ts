import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePedidosData } from '../../../../src/features/pedidos/hooks/usePedidosData';
import * as pedidoService from '../../../../src/services/pedido.service';
import { EstadoPedidoUsuario } from '../../../../src/services/pedido.types';

vi.mock('../../../../src/services/pedido.service');

describe('usePedidosData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(pedidoService.mapPedidoUsuarioToVisibleRow).mockImplementation(
      (pedidoUsuario) =>
        ({
          ...pedidoUsuario,
          entityType: 'pedido_usuario',
          pedidoUsuarioId: pedidoUsuario.id,
          proveedor: {
            id: pedidoUsuario.id,
            nombre: 'Proveedor visible',
          },
          pedidoProductos: [],
        }) as never
    );
  });

  it('pagina Mis pedidos sin descargar páginas adicionales', async () => {
    vi.mocked(pedidoService.fetchPedidoUsuarios).mockResolvedValue({
      data: [
        {
          id: 'pedido-usuario-2',
          numeroGlobal: '2',
          fechaPedido: '2026-04-01T10:00:00.000Z',
          costeTotal: 12.5,
          estado: EstadoPedidoUsuario.PENDIENTE,
          pedidos: [],
        },
      ],
      total: 25,
      totalPages: 3,
      page: 2,
      limit: 10,
    } as Awaited<ReturnType<typeof pedidoService.fetchPedidoUsuarios>>);

    const { result } = renderHook(() =>
      usePedidosData({
        page: 2,
        pageSize: 10,
        searchTerm: 'arroz',
        tabIndex: 0,
        currentUserId: 'user-1',
        misPedidosStatus: 'pendientes',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(pedidoService.fetchPedidoUsuarios).toHaveBeenCalledTimes(1);
    expect(pedidoService.fetchPedidoUsuarios).toHaveBeenCalledWith(
      2,
      10,
      'arroz',
      EstadoPedidoUsuario.PENDIENTE,
      {
        sortBy: 'fechaPedido',
        order: 'DESC',
        usuarioId: 'user-1',
      }
    );
    expect(result.current.totalItems).toBe(25);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toMatchObject({
      id: 'pedido-usuario-2',
      entityType: 'pedido_usuario',
      estado: EstadoPedidoUsuario.PENDIENTE,
    });
  });

  it('carga todas las páginas en Pedidos semanales sin filtrar por usuario', async () => {
    vi.mocked(pedidoService.fetchPedidoUsuarios)
      .mockResolvedValueOnce({
        data: [
          {
            id: 'pedido-usuario-1',
            numeroGlobal: '1',
            fechaPedido: '2026-04-08T09:00:00.000Z',
            costeTotal: 20,
            estado: EstadoPedidoUsuario.PENDIENTE,
            pedidos: [],
          },
        ],
        total: 2,
        totalPages: 2,
        page: 1,
        limit: 50,
      } as Awaited<ReturnType<typeof pedidoService.fetchPedidoUsuarios>>)
      .mockResolvedValueOnce({
        data: [
          {
            id: 'pedido-usuario-2',
            numeroGlobal: '2',
            fechaPedido: '2026-04-09T09:00:00.000Z',
            costeTotal: 35,
            estado: EstadoPedidoUsuario.APROBADO,
            pedidos: [],
          },
        ],
        total: 2,
        totalPages: 2,
        page: 2,
        limit: 50,
      } as Awaited<ReturnType<typeof pedidoService.fetchPedidoUsuarios>>);

    const { result } = renderHook(() =>
      usePedidosData({
        page: 3,
        pageSize: 10,
        searchTerm: '',
        tabIndex: 1,
        currentUserId: 'admin-user-id',
        misPedidosStatus: 'pendientes',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(pedidoService.fetchPedidoUsuarios).toHaveBeenCalledTimes(2);
    expect(pedidoService.fetchPedidoUsuarios).toHaveBeenNthCalledWith(
      1,
      1,
      50,
      '',
      '',
      {
        sortBy: 'fechaPedido',
        order: 'DESC',
      }
    );
    expect(pedidoService.fetchPedidoUsuarios).toHaveBeenNthCalledWith(
      2,
      2,
      50,
      '',
      '',
      {
        sortBy: 'fechaPedido',
        order: 'DESC',
      }
    );

    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data.map((item) => item.id)).toEqual([
      'pedido-usuario-1',
      'pedido-usuario-2',
    ]);
  });
});
