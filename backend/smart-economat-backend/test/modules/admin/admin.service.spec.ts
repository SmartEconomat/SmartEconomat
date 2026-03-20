import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from '../../../src/modules/admin/service/admin.service';
import {
  rolUsuario,
  UserStatus,
} from '../../../src/modules/usuario/enums/usuario.enums';

describe('AdminService', () => {
  const mockUsuarioRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const mockProfesorRepo = {};
  const mockDataSource = {
    transaction: jest.fn(),
  };
  const mockRolRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockAuthPermissionsService = {
    invalidateUserCache: jest.fn(),
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsuarioRepo.count.mockResolvedValue(2);
    service = new AdminService(
      mockUsuarioRepo as any,
      mockProfesorRepo as any,
      mockDataSource as any,
      mockRolRepo as any,
      mockAuthPermissionsService as any
    );
  });

  it('createProfesor crea usuario y profesor en una transacción', async () => {
    const profesorRole = { id: 'rol-prof', nombre: rolUsuario.PROFESOR };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(profesorRole),
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

    expect(manager.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        rol: rolUsuario.PROFESOR,
        roles: [profesorRole],
      })
    );
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
      rol: rolUsuario.PROFESOR,
      activo: true,
    });

    await expect(service.activateUser('user-2')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('getRoles devuelve los roles activos del sistema', async () => {
    const roles = [
      { id: '1', nombre: rolUsuario.ADMINISTRADOR, activo: true },
      { id: '2', nombre: rolUsuario.PROFESOR, activo: true },
    ];
    mockRolRepo.find.mockResolvedValue(roles);

    await expect(service.getRoles()).resolves.toEqual(roles);
    expect(mockRolRepo.find).toHaveBeenCalled();
  });

  it('updateUserRole sincroniza rol estático y dinámico e invalida cache', async () => {
    const user = {
      id: 'user-4',
      rol: rolUsuario.PROFESOR,
      status: UserStatus.ACTIVE,
      activo: true,
      roles: [],
    };
    const adminRole = {
      id: 'rol-admin',
      nombre: rolUsuario.ADMINISTRADOR,
      activo: true,
    };
    const updatedUser = {
      ...user,
      rol: rolUsuario.ADMINISTRADOR,
      roles: [adminRole],
    };

    const actor = {
      id: 'admin-1',
      rol: rolUsuario.ADMINISTRADOR,
      status: UserStatus.ACTIVE,
      activo: true,
    };

    mockUsuarioRepo.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(actor)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(updatedUser);

    mockRolRepo.findOne.mockResolvedValue(adminRole);
    mockUsuarioRepo.save.mockResolvedValue(updatedUser);

    await expect(
      service.updateUserRole('admin-1', user.id, adminRole.id)
    ).resolves.toEqual(updatedUser);

    expect(mockUsuarioRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        rol: rolUsuario.ADMINISTRADOR,
        roles: [adminRole],
      })
    );
    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      user.id
    );
  });

  it('activateUser con active=false suspende e invalida cache', async () => {
    const user = {
      id: 'user-5',
      rol: rolUsuario.PROFESOR,
      status: UserStatus.ACTIVE,
      activo: true,
      roles: [],
    };
    mockUsuarioRepo.findOne.mockResolvedValue(user);
    mockUsuarioRepo.save.mockResolvedValue(user);

    const result = await service.activateUser(user.id, false);

    expect(result).toEqual(
      expect.objectContaining({
        id: user.id,
        status: UserStatus.INACTIVE,
        activo: false,
      })
    );
    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      user.id
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
