import { ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/service/auth.service';

/**
 * Tests de regresión para AUTH-001:
 * El registro público debe estar protegido por la variable de entorno ALLOW_PUBLIC_REGISTER.
 */
describe('AuthService — feature flag ALLOW_PUBLIC_REGISTER', () => {
  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockJwt = { sign: jest.fn().mockReturnValue('token') };
  const mockDataSource = { transaction: jest.fn() };
  const mockMail = { sendPasswordResetEmail: jest.fn() };

  function makeService(allowPublicRegister: string | undefined) {
    const mockConfig = {
      get: jest.fn().mockReturnValue(allowPublicRegister),
    };
    return new AuthService(
      mockRepo as any,
      mockJwt as any,
      mockDataSource as any,
      mockMail as any,
      mockConfig as any
    );
  }

  it('lanza ForbiddenException cuando ALLOW_PUBLIC_REGISTER no está definido', async () => {
    const service = makeService(undefined);
    await expect(
      service.register({ username: 'u', password: 'p' } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza ForbiddenException cuando ALLOW_PUBLIC_REGISTER = "false"', async () => {
    const service = makeService('false');
    await expect(
      service.register({ username: 'u', password: 'p' } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('procede al registro cuando ALLOW_PUBLIC_REGISTER = "true"', async () => {
    const service = makeService('true');
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((_, p) => p),
      save: jest
        .fn()
        .mockImplementation((u) =>
          Promise.resolve({ ...u, id: 'u-1', roles: [] })
        ),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));
    await expect(
      service.register({ username: 'nuevo', password: 'Pass1234*' } as any)
    ).resolves.toBeDefined();
  });
});
