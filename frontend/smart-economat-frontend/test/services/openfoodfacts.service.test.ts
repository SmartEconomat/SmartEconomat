import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  searchByBarcode,
  searchByName,
} from '../../src/services/openfoodfacts.service';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
    parseApiResponse: vi.fn(),
  };
});

describe('openfoodfacts.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta el proxy backend por codigo de barras', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    const mockData = {
      success: true,
      message: 'Operación exitosa',
      data: {
        name: 'Leche Entera',
        brand: 'Pascual',
      },
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(mockData);

    await expect(searchByBarcode('1234567890123')).resolves.toEqual({
      name: 'Leche Entera',
      brand: 'Pascual',
    });

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/openfoodfacts/producto/1234567890123'
    );
    expect(apiService.parseApiResponse).toHaveBeenCalledWith(
      mockResponse,
      'No se pudo consultar OpenFoodFacts'
    );
  });

  it('consulta el proxy backend por nombre y devuelve lista vacia si falla', async () => {
    vi.mocked(apiService.baseFetch).mockRejectedValue(new Error('network'));

    await expect(searchByName('tomate frito')).resolves.toEqual([]);

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/openfoodfacts/buscar?nombre=tomate%20frito'
    );
  });
});
