import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchComparacionProveedores } from '../../src/services/productoProveedor.service';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();

  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('productoProveedor.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta la comparativa por producto y devuelve la data normalizada', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        message: 'ok',
        data: {
          productoId: 'prod-1',
          productoNombre: 'Leche',
          proveedores: [
            {
              productoProveedorId: 'pp-1',
              proveedorId: 'prov-1',
              proveedorNombre: 'Proveedor 1',
              precioUnitario: 2,
              mermaEsperada: 5,
              costeEfectivoUnitario: 2.1053,
              esOptimo: true,
              ahorroAbsoluto: 0.4,
              ahorroAbsolutoPct: 16,
            },
          ],
        },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    const result = await fetchComparacionProveedores('prod-1');

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/producto-proveedor/comparar/prod-1'
    );
    expect(result.productoId).toBe('prod-1');
    expect(result.proveedores).toHaveLength(1);
    expect(result.proveedores[0]?.esOptimo).toBe(true);
  });
});
