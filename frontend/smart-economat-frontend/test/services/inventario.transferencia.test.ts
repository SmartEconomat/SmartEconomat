import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ejecutarTransferenciaInventario } from '../../src/services/inventario.service';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('inventario.service ejecutarTransferenciaInventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia POST a /inventario/transferencias y devuelve la cabecera', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { id: 'tr-1', estado: 'completada' },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    const result = await ejecutarTransferenciaInventario({
      lineas: [
        {
          inventarioOrigenId: 'inv-a',
          ubicacionDestinoId: 'ub-b',
          cantidad: 2.5,
        },
      ],
      observaciones: 'prueba',
    });

    expect(result.id).toBe('tr-1');
    const [url, init] = vi.mocked(apiService.baseFetch).mock.calls[0];
    expect(url).toBe('/inventario/transferencias');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      lineas: [
        {
          inventarioOrigenId: 'inv-a',
          ubicacionDestinoId: 'ub-b',
          cantidad: 2.5,
        },
      ],
      observaciones: 'prueba',
    });
  });
});
