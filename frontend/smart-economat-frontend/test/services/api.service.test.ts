// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  baseFetch,
  buildQueryParams,
  normalizeGlobalFilters,
  unwrapPaginated,
} from '../../src/services/api.service';

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

  it('reintenta por defecto GET ante errores transitorios', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await baseFetch('/recetas');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta por defecto mutaciones POST', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      baseFetch('/produccion/ejecutar', {
        method: 'POST',
        body: JSON.stringify({ recetaId: 'id-1' }),
      })
    ).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('api.service filtros globales', () => {
  it('normaliza aliases legacy a llaves canonicas', () => {
    const normalized = normalizeGlobalFilters({
      searchTerm: '  leche  ',
      estado: 'pendiente',
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-01-31',
      categoria: 'LACTEO',
    });

    expect(normalized).toMatchObject({
      search: 'leche',
      status: 'pendiente',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      categoria: 'LACTEO',
    });
  });

  it('prioriza llaves canonicas si conviven con aliases', () => {
    const normalized = normalizeGlobalFilters({
      search: 'harina',
      searchTerm: 'azucar',
      status: 'activo',
      estado: 'inactivo',
    });

    expect(normalized.search).toBe('harina');
    expect(normalized.status).toBe('activo');
  });

  it('serializa filtros en query params usando alias backend legacy', () => {
    const query = buildQueryParams({
      page: 2,
      limit: 500,
      search: 'tomate',
      status: 'abierto',
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
      categoria: 'VERDURA',
      tags: ['fresco', 'local'],
    });

    expect(query.get('page')).toBe('2');
    expect(query.get('limit')).toBe('50');
    expect(query.get('searchTerm')).toBe('tomate');
    expect(query.get('estado')).toBe('abierto');
    expect(query.get('fechaDesde')).toBe('2026-02-01');
    expect(query.get('fechaHasta')).toBe('2026-02-28');
    expect(query.get('categoria')).toBe('VERDURA');
    expect(query.get('tags')).toBe('fresco,local');
  });
});

describe('unwrapPaginated', () => {
  it('extrae metadatos cuando data es paginación', () => {
    const parsed = unwrapPaginated<{ id: string }>({
      data: [{ id: 'a' }],
      total: 10,
      page: 2,
      limit: 50,
      totalPages: 1,
    });
    expect(parsed?.data).toHaveLength(1);
    expect(parsed?.totalPages).toBe(1);
  });

  it('devuelve null si no hay lista en data', () => {
    expect(unwrapPaginated({ data: null })).toBeNull();
    expect(unwrapPaginated(null)).toBeNull();
  });
});
