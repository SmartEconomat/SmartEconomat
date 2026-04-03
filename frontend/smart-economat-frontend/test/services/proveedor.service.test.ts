import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProveedor } from '../../src/services/proveedor.service';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('proveedor.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('limpia y restringe el payload de creacion al DTO backend', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { id: 'prov-1', nombre: 'Acme' },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await expect(
      createProveedor({
        id: 'legacy-id',
        createdAt: '2025-01-01T00:00:00.000Z',
        nombre: '  Acme  ',
        email: '  COMPRAS@ACME.COM  ',
        contacto: '  Ana  ',
      } as unknown as Parameters<typeof createProveedor>[0])
    ).resolves.toEqual({ id: 'prov-1', nombre: 'Acme' });

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/proveedor',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Acme',
          contacto: 'Ana',
          email: 'compras@acme.com',
        }),
      })
    );
  });

  it('falla antes de enviar si el nombre obligatorio queda vacio', async () => {
    await expect(createProveedor({ nombre: '   ' })).rejects.toThrow(
      /nombre del proveedor.*(vacio|obligatorio)/i
    );
    expect(apiService.baseFetch).not.toHaveBeenCalled();
  });
});
