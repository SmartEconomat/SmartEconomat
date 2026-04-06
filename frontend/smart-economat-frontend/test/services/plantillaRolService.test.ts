import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiService from '../../src/services/api.service';
import { plantillaRolService } from '../../src/services/plantillaRolService';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
    parseApiResponse: vi.fn(),
  };
});

describe('plantillaRolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta el listado de plantillas en la ruta esperada', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    const mockPayload = {
      success: true,
      message: 'ok',
      data: [],
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(
      mockPayload as Awaited<ReturnType<typeof apiService.parseApiResponse>>
    );

    await expect(plantillaRolService.getPlantillas()).resolves.toEqual({
      data: [],
      status: 200,
      message: 'ok',
    });

    expect(apiService.baseFetch).toHaveBeenCalledWith('/plantillas-roles');
  });

  it('duplica plantilla enviando nombre saneado', async () => {
    const mockResponse = { ok: true, status: 201 } as Response;
    const mockPayload = {
      success: true,
      message: 'duplicada',
      data: { id: 'tpl-1' },
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(
      mockPayload as Awaited<ReturnType<typeof apiService.parseApiResponse>>
    );

    await plantillaRolService.duplicatePlantilla('tpl-0', '  COPIA ADMIN  ');

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/plantillas-roles/tpl-0/duplicar',
      {
        method: 'POST',
        body: JSON.stringify({ nombre: 'COPIA ADMIN' }),
      }
    );
  });

  it('actualiza permisos de una plantilla con PATCH', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    const mockPayload = {
      success: true,
      message: 'actualizada',
      data: { id: 'tpl-1', permisos: [{ id: 'perm-1' }] },
    };

    vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
    vi.mocked(apiService.parseApiResponse).mockResolvedValue(
      mockPayload as Awaited<ReturnType<typeof apiService.parseApiResponse>>
    );

    await plantillaRolService.updatePermisos('tpl-1', ['perm-1', 'perm-2']);

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/plantillas-roles/tpl-1/permisos',
      {
        method: 'PATCH',
        body: JSON.stringify({ permisoIds: ['perm-1', 'perm-2'] }),
      }
    );
  });
});
