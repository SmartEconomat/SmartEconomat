import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRecepcion,
  deleteRecepcion,
  fetchRecepciones,
} from '../../src/services/recepcion.service';

describe('recepcion.service', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetchRecepciones usa el endpoint plural /recepciones', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { data: [], total: 0, totalPages: 0 },
      }),
    });

    await fetchRecepciones();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/recepciones?limit=50',
      expect.anything()
    );
  });

  it('createRecepcion usa el endpoint plural /recepciones', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: { id: 'recep-1' },
      }),
    });

    await createRecepcion({
      usuarioId: 'u-1',
      pedidos: [{ pedidoId: 'p-1' }],
      productos: [],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/recepciones',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('deleteRecepcion usa el endpoint plural /recepciones/:id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await deleteRecepcion('recep-123');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/recepciones/recep-123',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});
