import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from '../../../src/modules/admin/service/admin.service';
import { UserStatus } from '../../../src/modules/usuario/enums/usuario.enums';

describe('AdminService', () => {
  const mockUsuarioRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockProfesorRepo = {};
  const mockDataSource = {
    transaction: jest.fn(),
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(
      mockUsuarioRepo as any,
      mockProfesorRepo as any,
      mockDataSource as any
    );
  });

  it('createProfesor crea usuario y profesor en una transacción', async () => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      create: jest
        .fn()
        .mockImplementation((_: unknown, payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementationOnce((entity: any) => {
          entity.id = 'user-1';
          return Promise.resolve(entity);
        })
        .mockImplementationOnce((entity: any) => {
          entity.id = 'prof-1';
          return Promise.resolve(entity);
        }),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.createProfesor({
      username: 'profe',
      email: 'profe@demo.local',
      password: 'Password123*',
      cial: 'CIAL1',
    } as any);

    expect(result).toEqual({
      id: 'prof-1',
      user_id: 'user-1',
      username: 'profe',
      cial: 'CIAL1',
      status: UserStatus.INACTIVE,
    });
  });

  it('createProfesor rechaza CIAL duplicado', async () => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'prof-x' }),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.createProfesor({
        username: 'profe',
        password: 'x',
        cial: 'CIAL1',
      } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('activateUser rechaza usuarios ya activos', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue({
      id: 'user-2',
      status: UserStatus.ACTIVE,
    });

    await expect(service.activateUser('user-2')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('activateUser lanza NotFoundException si el usuario no existe', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue(null);

    await expect(service.activateUser('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('forcePasswordReset genera password provisional de 8 caracteres y mustChangePassword', async () => {
    const user = {
      id: 'user-3',
      password: 'old',
      mustChangePassword: false,
      passwordResetToken: 'token',
      passwordResetExpires: new Date(),
    };
    mockUsuarioRepo.findOne.mockResolvedValue(user);
    mockUsuarioRepo.save.mockImplementation((entity: unknown) =>
      Promise.resolve(entity)
    );

    const result = await service.forcePasswordReset('user-3');

    expect(result.provisionalPassword).toHaveLength(8);
    expect(result.mustChangePassword).toBe(true);
    expect(user.mustChangePassword).toBe(true);
    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
  });
});
