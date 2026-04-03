import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMovimiento,
  fetchMovimientos,
} from '../../src/services/movimiento.service';
import { TipoMovimiento } from '../../src/services/movimiento.types';
import * as apiService from '../../src/services/api.service';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('movimiento.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ajusta la paginacion al maximo permitido por backend', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await expect(
      fetchMovimientos({
        page: 0,
        limit: 200,
        type: [TipoMovimiento.ENTRADA, TipoMovimiento.SALIDA],
        sortOrder: 'ASC',
      })
    ).resolves.toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    });

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/movimientos?page=1&limit=50&type=entrada&type=salida&order=ASC'
    );
  });

  it('normaliza el payload de creacion y omite ids opcionales vacios', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          id: 'mov-1',
          tipo: TipoMovimiento.ENTRADA,
          cantidad: 2,
          entidad: 'inventario',
          entidadId: 'inv-1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      }),
    } as unknown as Response;

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);

    await expect(
      createMovimiento({
        tipo: TipoMovimiento.ENTRADA,
        cantidad: 2,
        entidadTipo: '  inventario  ',
        entidadId: '  inv-1  ',
        descripcion: '  ajuste manual  ',
        inventario: '   ',
      })
    ).resolves.toMatchObject({ id: 'mov-1' });

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/movimientos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          tipo: TipoMovimiento.ENTRADA,
          cantidad: 2,
          entidadTipo: 'inventario',
          entidadId: 'inv-1',
          descripcion: 'ajuste manual',
        }),
      })
    );
  });
});
