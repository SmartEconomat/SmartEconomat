import { ForbiddenException } from '@nestjs/common';
import { ProfesorService } from '../../../src/modules/profesor/service/profesor.service';

/**
 * Tests de regresión para PROF-001:
 * El registro público de profesores debe estar protegido por ALLOW_PUBLIC_REGISTER.
 */
describe('ProfesorService — feature flag ALLOW_PUBLIC_REGISTER', () => {
  const mockProfesorRepo = {};
  const mockSlotRepo = {};
  const mockDataSource = { transaction: jest.fn() };

  function makeService(allowPublicRegister: string | undefined) {
    const mockConfig = { get: jest.fn().mockReturnValue(allowPublicRegister) };
    return new ProfesorService(
      mockProfesorRepo as any,
      mockSlotRepo as any,
      mockDataSource as any,
      mockConfig as any
    );
  }

  it('lanza ForbiddenException cuando ALLOW_PUBLIC_REGISTER no está definido', async () => {
    const service = makeService(undefined);
    await expect(
      service.register({ username: 'prof', password: 'p', cial: 'C001' } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza ForbiddenException cuando ALLOW_PUBLIC_REGISTER = "false"', async () => {
    const service = makeService('false');
    await expect(
      service.register({ username: 'prof', password: 'p', cial: 'C001' } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('pasa al registro cuando ALLOW_PUBLIC_REGISTER = "true" (no lanza ForbiddenException)', async () => {
    const service = makeService('true');
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((_, p) => p),
      save: jest
        .fn()
        .mockImplementation((u) => Promise.resolve({ ...u, id: 'p-1' })),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    try {
      const result = await service.register({
        username: 'prof',
        password: 'p',
        cial: 'C001',
        nombre: 'T',
      } as any);
      expect(result).toBeDefined();
    } catch (err) {
      expect(err).not.toBeInstanceOf(ForbiddenException);
    }
  });
});
