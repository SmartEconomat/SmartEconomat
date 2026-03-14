import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../src/modules/usuario/enums/usuario.enums';
import { UsuarioService } from '../../../src/modules/usuario/service/usuario.service';

describe('UsuarioService', () => {
  const mockUsuarioRepo = {
    createUsuario: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updateUsuario: jest.fn(),
    repo: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockPermisoRepo = {
    findOneBy: jest.fn(),
  };

  const mockAuthPermissionsService = {
    invalidateUserCache: jest.fn(),
  };

  let service: UsuarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsuarioService(
      mockUsuarioRepo as any,
      mockDataSource as any,
      mockPermisoRepo as any,
      mockAuthPermissionsService as any
    );
  });

  it('findOne lanza NotFoundException si el usuario no existe', async () => {
    mockUsuarioRepo.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('changePassword rechaza la contraseña antigua incorrecta', async () => {
    mockUsuarioRepo.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      password: await bcrypt.hash('Correcta123*', 10),
    });

    await expect(
      service.changePassword('user-1', {
        oldPassword: 'Incorrecta123*',
        newPassword: 'Nueva123*',
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resetPassword activa mustChangePassword y actualiza password', async () => {
    mockUsuarioRepo.findById.mockResolvedValue({
      id: 'user-2',
      status: UserStatus.ACTIVE,
    });
    mockUsuarioRepo.updateUsuario.mockResolvedValue({
      id: 'user-2',
      mustChangePassword: true,
    });

    const result = await service.resetPassword('user-2', {
      password: 'Temporal123*',
    });

    expect(mockUsuarioRepo.updateUsuario).toHaveBeenCalledWith('user-2', {
      password: 'Temporal123*',
      mustChangePassword: true,
    });
    expect(result).toEqual({ id: 'user-2', mustChangePassword: true });
  });

  it('addAdditionalPermission invalida caché cuando asigna un permiso nuevo', async () => {
    mockUsuarioRepo.findById.mockResolvedValue({ id: 'user-3' });
    mockPermisoRepo.findOneBy.mockResolvedValue({ id: 'perm-1' });
    mockUsuarioRepo.repo.findOne.mockResolvedValue({
      id: 'user-3',
      permisosAdicionales: [],
    });
    mockUsuarioRepo.repo.save.mockResolvedValue(undefined);
    mockUsuarioRepo.findById
      .mockResolvedValueOnce({ id: 'user-3' })
      .mockResolvedValueOnce({
        id: 'user-3',
        permisosAdicionales: [{ id: 'perm-1' }],
      });

    const result = await service.addAdditionalPermission('user-3', 'perm-1');

    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      'user-3'
    );
    expect(result).toEqual({
      id: 'user-3',
      permisosAdicionales: [{ id: 'perm-1' }],
    });
  });

  it('addExcludedPermission invalida caché cuando asigna un permiso excluido nuevo', async () => {
    mockUsuarioRepo.findById.mockResolvedValue({ id: 'user-4' });
    mockPermisoRepo.findOneBy.mockResolvedValue({ id: 'perm-2' });
    mockUsuarioRepo.repo.findOne.mockResolvedValue({
      id: 'user-4',
      permisosExcluidos: [],
    });
    mockUsuarioRepo.repo.save.mockResolvedValue(undefined);
    mockUsuarioRepo.findById
      .mockResolvedValueOnce({ id: 'user-4' })
      .mockResolvedValueOnce({
        id: 'user-4',
        permisosExcluidos: [{ id: 'perm-2' }],
      });

    const result = await service.addExcludedPermission('user-4', 'perm-2');

    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      'user-4'
    );
    expect(result).toEqual({
      id: 'user-4',
      permisosExcluidos: [{ id: 'perm-2' }],
    });
  });

  it('removeAdditionalPermission sigue invalidando caché aunque el permiso no estuviera asignado', async () => {
    mockUsuarioRepo.repo.findOne.mockResolvedValue({
      id: 'user-5',
      permisosAdicionales: [{ id: 'perm-otro' }],
    });
    mockUsuarioRepo.repo.save.mockResolvedValue(undefined);
    mockUsuarioRepo.findById.mockResolvedValue({
      id: 'user-5',
      permisosAdicionales: [{ id: 'perm-otro' }],
    });

    await service.removeAdditionalPermission('user-5', 'perm-ausente');

    expect(mockUsuarioRepo.repo.save).toHaveBeenCalledWith({
      id: 'user-5',
      permisosAdicionales: [{ id: 'perm-otro' }],
    });
    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      'user-5'
    );
  });
});
