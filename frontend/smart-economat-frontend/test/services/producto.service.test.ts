import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateProductoEan13 } from '../../src/services/producto.service';
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
});
