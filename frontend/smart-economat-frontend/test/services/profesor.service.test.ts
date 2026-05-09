import { describe, expect, it, vi, beforeEach } from 'vitest';

const { baseFetchMock } = vi.hoisted(() => ({
  baseFetchMock: vi.fn(),
}));

vi.mock('../../src/services/api.service', () => ({
  ApiError: class extends Error {},
  baseFetch: baseFetchMock,
  parseApiResponse: vi.fn(async () => ({
    success: true,
    data: {},
    message: '',
  })),
}));

import { profesorService } from '../../src/services/profesor.service';

describe('profesorService contract', () => {
  beforeEach(() => {
    baseFetchMock.mockReset();
    baseFetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ success: true, data: {} }),
    });
  });

  it('uses POST /profesores/alumnos/:id/force-reset', async () => {
    await profesorService.forcePasswordReset('alumno-123');

    expect(baseFetchMock).toHaveBeenCalledWith(
      '/profesores/alumnos/alumno-123/force-reset',
      { method: 'POST' }
    );
  });

  it('uses DELETE /profesores/alumnos/:id for student removal', async () => {
    await profesorService.removeStudent('alumno-456');

    expect(baseFetchMock).toHaveBeenCalledWith(
      '/profesores/alumnos/alumno-456',
      {
        method: 'DELETE',
      }
    );
  });
});
