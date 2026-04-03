// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, baseFetch } from '../../src/services/api.service';

describe('api.service baseFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = '';
  });

  it('bloquea ids invalidos en la ruta antes de llamar a fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(baseFetch('/productos/undefined')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
    });
    await expect(baseFetch('/productos/undefined')).rejects.toBeInstanceOf(
      ApiError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bloquea ids invalidos en el body json antes de llamar a fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      baseFetch('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          proveedorId: '',
          lineas: [{ productoProveedorId: 'prov-1', cantidad: 1 }],
        }),
      })
    ).rejects.toThrow(/body.proveedorId/);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deja pasar requests validas y conserva credentials include', async () => {
    const response = new Response(null, { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(baseFetch('/recetas?page=1&limit=20')).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/recetas?page=1&limit=20',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
