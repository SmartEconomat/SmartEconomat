import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventarioItem } from '../../src/services/inventario.types';

const baseFetchMock = vi.fn();

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: (...args: Parameters<typeof actual.baseFetch>) =>
      baseFetchMock(...args),
  };
});

import {
  fetchInventario,
  invalidateInventarioCache,
} from '../../src/services/inventario.service';

describe('fetchInventario paginación en cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateInventarioCache();
  });

  afterEach(() => {
    invalidateInventarioCache();
  });

  it('solicita páginas adicionales hasta totalPages', async () => {
    const item1 = { id: 'inv-a', cantidadActual: 10 } as InventarioItem;
    const item2 = { id: 'inv-b', cantidadActual: 5 } as InventarioItem;

    baseFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            data: [item1],
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 2,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            data: [item2],
            total: 2,
            page: 2,
            limit: 50,
            totalPages: 2,
          },
        }),
      });

    const out = await fetchInventario({
      search: 'arroz',
      forceRefresh: true,
    });

    expect(baseFetchMock).toHaveBeenCalledTimes(2);
    const firstUrl = baseFetchMock.mock.calls[0][0] as string;
    expect(firstUrl).toContain('page=1');
    expect(firstUrl).toContain('searchTerm=arroz');

    expect(out.map((i) => i.id).sort()).toEqual(['inv-a', 'inv-b']);
  });

  it('envía ubicacionIds como lista en query', async () => {
    baseFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      }),
    });

    await fetchInventario({
      ubicacionIds: ['01954a87-0778-74d4-bb32-55b12044579f'],
      forceRefresh: true,
    });

    const url = String(baseFetchMock.mock.calls[0][0]);
    expect(url).toContain('ubicacionIds=');
    expect(url).toContain('01954a87-0778-74d4-bb32-55b12044579f');
  });
});
