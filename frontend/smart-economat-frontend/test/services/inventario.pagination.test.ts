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

const makePageResponse = (
  items: Partial<InventarioItem>[],
  page: number,
  total: number,
  limit: number
) => ({
  ok: true,
  status: 200,
  json: async () => ({
    success: true,
    data: {
      data: items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    },
  }),
});

describe('fetchInventario - paginación server-side', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateInventarioCache();
  });

  afterEach(() => {
    invalidateInventarioCache();
  });

  // ─── Una sola petición HTTP ────────────────────────────────────────────────

  describe('una sola petición HTTP', () => {
    it('hace exactamente UNA petición HTTP por llamada', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      await fetchInventario({ page: 1, limit: 20 });

      expect(baseFetchMock).toHaveBeenCalledTimes(1);
    });

    it('REGRESIÓN: con 1000 ítems disponibles (50 páginas posibles) solo hace 1 llamada', async () => {
      // Con el bug anterior (bucle while), habría hecho 50 llamadas HTTP
      const fakeItems = Array.from({ length: 20 }, (_, i) => ({
        id: `inv-${i}`,
        cantidadActual: 1,
        cantidadMinima: 0,
      }));
      baseFetchMock.mockResolvedValue(makePageResponse(fakeItems, 1, 1000, 20));

      await fetchInventario({ page: 1, limit: 20 });

      expect(baseFetchMock).toHaveBeenCalledTimes(1);
    });

    it('REGRESIÓN: no acumula items de otras páginas en la respuesta', async () => {
      const item = { id: 'inv-page1', cantidadActual: 5, cantidadMinima: 0 };
      baseFetchMock.mockResolvedValue(makePageResponse([item], 1, 500, 20));

      const result = await fetchInventario({ page: 1, limit: 20 });

      // Solo debe contener los items de la página pedida, no acumular 500
      expect(result.data.length).toBeLessThanOrEqual(20);
      expect(result.data[0].id).toBe('inv-page1');
    });

    it('deduplica peticiones en vuelo con la misma página y filtros', async () => {
      baseFetchMock.mockResolvedValue(makePageResponse([], 1, 0, 20));

      // Dos llamadas simultáneas con los mismos parámetros
      await Promise.all([
        fetchInventario({ page: 1, limit: 20, forceRefresh: true }),
        fetchInventario({ page: 1, limit: 20, forceRefresh: true }),
      ]);

      expect(baseFetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Parámetros de paginación en la URL ───────────────────────────────────

  describe('parámetros de paginación en la URL', () => {
    it('incluye page y limit en la query string', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 2, 100, 20));

      await fetchInventario({ page: 2, limit: 20 });

      const url = baseFetchMock.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=20');
    });

    it('usa page=1 y limit=20 como valores por defecto', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      await fetchInventario({});

      const url = baseFetchMock.mock.calls[0][0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
    });

    it('transmite searchTerm correctamente', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      await fetchInventario({ search: 'tomate', page: 1, limit: 20 });

      const url = baseFetchMock.mock.calls[0][0] as string;
      expect(url).toContain('searchTerm=tomate');
    });

    it('transmite ubicacionIds al servidor', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      await fetchInventario({
        ubicacionIds: ['01954a87-0778-74d4-bb32-55b12044579f'],
        page: 1,
        limit: 20,
      });

      const url = baseFetchMock.mock.calls[0][0] as string;
      expect(url).toContain('ubicacionIds=');
      expect(url).toContain('01954a87-0778-74d4-bb32-55b12044579f');
    });

    it('transmite onlyLowStock al servidor', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      await fetchInventario({ onlyLowStock: true, page: 1, limit: 20 });

      const url = baseFetchMock.mock.calls[0][0] as string;
      expect(url).toContain('onlyLowStock=true');
    });

    it('peticiones a páginas distintas usan URLs distintas', async () => {
      baseFetchMock.mockResolvedValue(makePageResponse([], 1, 50, 20));

      await fetchInventario({ page: 1, limit: 20, forceRefresh: true });
      await fetchInventario({ page: 2, limit: 20, forceRefresh: true });

      const url1 = baseFetchMock.mock.calls[0][0] as string;
      const url2 = baseFetchMock.mock.calls[1][0] as string;
      expect(url1).toContain('page=1');
      expect(url2).toContain('page=2');
      expect(baseFetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Respuesta paginada del servidor ──────────────────────────────────────

  describe('respuesta paginada del servidor', () => {
    it('devuelve PaginatedData con total, page, limit y totalPages del servidor', async () => {
      const serverItem = { id: 'inv-1', cantidadActual: 5, cantidadMinima: 2 };
      baseFetchMock.mockResolvedValueOnce(
        makePageResponse([serverItem], 3, 150, 20)
      );

      const result = await fetchInventario({ page: 3, limit: 20 });

      expect(result.total).toBe(150);
      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(8);
      expect(result.limit).toBe(20);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('inv-1');
    });

    it('maneja inventario vacío sin errores', async () => {
      baseFetchMock.mockResolvedValueOnce(makePageResponse([], 1, 0, 20));

      const result = await fetchInventario({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('filtra ítems eliminados (deletedAt) de la respuesta', async () => {
      const items = [
        { id: 'activo', cantidadActual: 5, cantidadMinima: 0, deletedAt: null },
        {
          id: 'borrado',
          cantidadActual: 10,
          cantidadMinima: 0,
          deletedAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      baseFetchMock.mockResolvedValueOnce(makePageResponse(items, 1, 2, 20));

      const result = await fetchInventario({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('activo');
    });

    it('filtra ítems con cantidadActual=0 de la respuesta', async () => {
      const items = [
        { id: 'con-stock', cantidadActual: 3, cantidadMinima: 0 },
        { id: 'sin-stock', cantidadActual: 0, cantidadMinima: 0 },
      ];
      baseFetchMock.mockResolvedValueOnce(makePageResponse(items, 1, 2, 20));

      const result = await fetchInventario({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('con-stock');
    });

    it('lanza error cuando la respuesta HTTP no es ok', async () => {
      baseFetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchInventario({ page: 1, limit: 20 })).rejects.toThrow(
        'Error al obtener inventario: 500'
      );
    });
  });

  // ─── Caché ────────────────────────────────────────────────────────────────

  describe('caché de página 1 sin filtros', () => {
    it('retorna la caché en la segunda llamada sin forceRefresh', async () => {
      const item = { id: 'cached', cantidadActual: 1, cantidadMinima: 0 };
      baseFetchMock.mockResolvedValue(makePageResponse([item], 1, 1, 20));

      await fetchInventario({ page: 1, limit: 20 });
      await fetchInventario({ page: 1, limit: 20 });

      // Solo una petición real; la segunda usa la caché
      expect(baseFetchMock).toHaveBeenCalledTimes(1);
    });

    it('no cachea cuando hay filtros de servidor', async () => {
      baseFetchMock.mockResolvedValue(makePageResponse([], 1, 0, 20));

      await fetchInventario({ search: 'arroz', page: 1, limit: 20 });
      await fetchInventario({ search: 'arroz', page: 1, limit: 20 });

      expect(baseFetchMock).toHaveBeenCalledTimes(2);
    });

    it('no cachea páginas distintas de la 1', async () => {
      baseFetchMock.mockResolvedValue(makePageResponse([], 2, 50, 20));

      await fetchInventario({ page: 2, limit: 20 });
      await fetchInventario({ page: 2, limit: 20 });

      expect(baseFetchMock).toHaveBeenCalledTimes(2);
    });

    it('invalida la caché con forceRefresh', async () => {
      baseFetchMock.mockResolvedValue(makePageResponse([], 1, 0, 20));

      await fetchInventario({ page: 1, limit: 20 });
      await fetchInventario({ page: 1, limit: 20, forceRefresh: true });

      expect(baseFetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
