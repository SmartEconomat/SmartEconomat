import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelPedido, createPedido, updatePedido } from './pedido.service';

describe('pedido.service', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('createPedido envía solo proveedorId, observaciones y líneas', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'ok',
        data: { id: 'ped-1' },
      }),
    });

    await createPedido({
      proveedorId: 'prov-1',
      observaciones: 'Entrega semanal',
      lineas: [{ productoProveedorId: 'pp-1', cantidad: 3 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pedidos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          proveedorId: 'prov-1',
          observaciones: 'Entrega semanal',
          lineas: [{ productoProveedorId: 'pp-1', cantidad: 3 }],
        }),
      })
    );
  });

  it('updatePedido no envía campos legacy de fechaEntrega ni estado', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'ok',
        data: { id: 'ped-2' },
      }),
    });

    await updatePedido('ped-2', {
      observaciones: 'Actualizar observaciones',
      lineas: [{ productoProveedorId: 'pp-2', cantidad: 1 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pedidos/ped-2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          observaciones: 'Actualizar observaciones',
          lineas: [{ productoProveedorId: 'pp-2', cantidad: 1 }],
        }),
      })
    );
  });

  it('cancelPedido usa el endpoint dedicado con motivoCancelacion', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'ok',
        data: { id: 'ped-3', estado: 'cancelado' },
      }),
    });

    await cancelPedido('ped-3', {
      motivoCancelacion: 'Proveedor sin stock',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pedidos/ped-3/cancelar',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          motivoCancelacion: 'Proveedor sin stock',
        }),
      })
    );
  });
});
