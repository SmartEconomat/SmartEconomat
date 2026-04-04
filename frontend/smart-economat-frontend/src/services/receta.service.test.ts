import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRecetas } from './receta.service';
import * as apiService from './api.service';

vi.mock('./api.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
    parseApiResponse: vi.fn(),
  };
});

describe('receta.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ajusta el limit al maximo permitido por backend y recorta la busqueda', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    const mockPayload = {
      success: true,
      message: 'ok',
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(
      mockPayload as Awaited<ReturnType<typeof apiService.parseApiResponse>>
    );

    await expect(fetchRecetas(1, 100, '  arroz  ')).resolves.toEqual(
      mockPayload.data
    );
    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/recetas?page=1&limit=50&searchTerm=arroz'
    );
  });

  it('serializa sortBy y order para ordenacion server-side', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    const mockPayload = {
      success: true,
      message: 'ok',
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(
      mockPayload as Awaited<ReturnType<typeof apiService.parseApiResponse>>
    );

    await fetchRecetas(1, 10, '', 'dificultad', 'desc');

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/recetas?page=1&limit=10&sortBy=dificultad&order=DESC'
    );
  });
});
