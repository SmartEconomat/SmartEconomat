import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiService from '../../src/services/api.service';
import { fetchMermaStats } from '../../src/services/merma.service';
import { MotivoMerma } from '../../src/services/merma.types';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();

  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

describe('merma.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMermaStats no inyecta paginacion y serializa filtros de stats', async () => {
    vi.mocked(apiService.baseFetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          porMotivo: [],
          porProducto: [],
        },
      }),
    } as unknown as Response);

    await fetchMermaStats({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      motivo: MotivoMerma.ROTURA,
    });

    expect(apiService.baseFetch).toHaveBeenCalledWith(
      '/merma/stats?startDate=2026-01-01&endDate=2026-01-31&motivo=rotura'
    );

    const calledPath = vi.mocked(apiService.baseFetch).mock.calls[0]?.[0] as
      | string
      | undefined;
    expect(calledPath).not.toContain('page=');
    expect(calledPath).not.toContain('limit=');
  });

  it('fetchMermaStats usa endpoint limpio sin query cuando no hay filtros', async () => {
    vi.mocked(apiService.baseFetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          porMotivo: [],
          porProducto: [],
        },
      }),
    } as unknown as Response);

    await fetchMermaStats();

    expect(apiService.baseFetch).toHaveBeenCalledWith('/merma/stats');
  });
});
