import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProductos,
  generateProductoEan13,
  invalidateProductosCache,
} from '../../src/services/producto.service';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();

  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('producto.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateProductosCache();
  });

  it('recupera un codigo EAN-13 generado por el backend', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { codigo_barras: '1234567890128' },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await expect(generateProductoEan13()).resolves.toBe('1234567890128');
    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/productos/generar-ean13'
    );
  });

  it('falla si el backend no devuelve un codigo EAN-13 valido', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { codigo_barras: '   ' },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await expect(generateProductoEan13()).rejects.toThrow(/EAN-13 valido/i);
  });

  it('lista de inactivos: GET incluye soloEliminados=true (contrato ProductFilterDto)', async () => {
    const listPayload = {
      success: true,
      message: 'ok',
      data: {
        data: [] as unknown[],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(listPayload),
    } as unknown as Response;
    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await fetchProductos({
      page: 1,
      limit: 20,
      searchTerm: '',
      categorias: [],
      sortBy: 'nombre',
      order: 'asc',
      soloEliminados: true,
    });

    const calledUrl = vi.mocked(apiService.baseFetch).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('soloEliminados=true');
    expect(calledUrl).not.toContain('includeDeleted');
  });

  it('lista de activos: soloEliminados no va como true', async () => {
    const listPayload = {
      success: true,
      message: 'ok',
      data: {
        data: [] as unknown[],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(listPayload),
    } as unknown as Response;
    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await fetchProductos({
      page: 1,
      limit: 20,
      searchTerm: '',
      categorias: [],
      sortBy: 'nombre',
      order: 'asc',
      soloEliminados: false,
    });

    const calledUrl = vi.mocked(apiService.baseFetch).mock
      .calls[0][0] as string;
    expect(calledUrl).not.toMatch(/[&?]soloEliminados=true\b/);
  });
});
