import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RolesService } from '../../../src/modules/roles/service/roles.service';

describe('RolesService', () => {
  const mockRolRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };
  const mockUsuarioRepo = {
    findOne: jest.fn(),
  };
  const mockPermisoRepo = {
    find: jest.fn(),
  };
  const mockUsuarioRolRepo = {
    count: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockAuthPermissionsService = {
    invalidateUserCache: jest.fn(),
    invalidateUsersCache: jest.fn(),
  };

  let service: RolesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RolesService(
      mockRolRepo as any,
      mockUsuarioRepo as any,
      mockPermisoRepo as any,
      mockUsuarioRolRepo as any,
      mockAuthPermissionsService as any
    );
  });

  it('create rechaza nombres duplicados', async () => {
    mockRolRepo.findOne.mockResolvedValue({ id: 'rol-1' });

    await expect(
      service.create({ nombre: 'ADMIN' } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create asigna permisos en la creación', async () => {
    const assignPermissionsSpy = jest
      .spyOn(service, 'assignPermissions')
      .mockResolvedValue({ id: 'rol-2' } as any);

    mockRolRepo.findOne.mockResolvedValueOnce(null);
    mockRolRepo.create.mockReturnValue({ id: 'rol-2', nombre: 'COMPRAS' });
    mockRolRepo.save.mockResolvedValue({ id: 'rol-2', nombre: 'COMPRAS' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'rol-2' } as any);

    const result = await service.create({
      nombre: 'COMPRAS',
      permisoIds: ['perm-1', 'perm-2'],
    } as any);

    expect(assignPermissionsSpy).toHaveBeenCalledWith('rol-2', {
      permisoIds: ['perm-1', 'perm-2'],
    });
    expect(result).toEqual({ id: 'rol-2' });
  });

  it('update impide modificar un rol de sistema', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'rol-3',
      nombre: 'ADMIN',
      esSistema: true,
    } as any);

    await expect(
      service.update('rol-3', { esSistema: false } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove rechaza roles de sistema', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'rol-4',
      esSistema: true,
    } as any);

    await expect(service.remove('rol-4')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('remove rechaza roles con usuarios asignados', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'rol-5',
      esSistema: false,
    } as any);
    mockUsuarioRolRepo.count.mockResolvedValue(2);

    await expect(service.remove('rol-5')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockRolRepo.softDelete).not.toHaveBeenCalled();
  });

  it('assignPermissions invalida caché de usuarios afectados', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'rol-6',
      esSistema: false,
      permisos: [],
    } as any);
    mockPermisoRepo.find.mockResolvedValue([
      { id: 'perm-1' },
      { id: 'perm-2' },
    ]);
    mockRolRepo.save.mockResolvedValue(undefined);
    mockUsuarioRolRepo.find.mockResolvedValue([
      { usuarioId: 'user-1' },
      { usuarioId: 'user-2' },
    ]);

    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({
        id: 'rol-6',
        esSistema: false,
        permisos: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'rol-6',
        permisos: [{ id: 'perm-1' }],
      } as any);

    const result = await service.assignPermissions('rol-6', {
      permisoIds: ['perm-1', 'perm-2'],
    });

    expect(
      mockAuthPermissionsService.invalidateUsersCache
    ).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(result).toEqual({ id: 'rol-6', permisos: [{ id: 'perm-1' }] });
  });

  it('assignRoleToUser reactiva asignaciones existentes', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue({ id: 'user-1' });
    mockUsuarioRolRepo.findOne.mockResolvedValue({
      usuarioId: 'user-1',
      rolId: 'rol-7',
      activo: false,
    });
    mockUsuarioRolRepo.save.mockImplementation((value: unknown) =>
      Promise.resolve(value)
    );

    const result = await service.assignRoleToUser(
      { usuarioId: 'user-1', rolId: 'rol-7' } as any,
      'admin-1'
    );

    expect(result).toMatchObject({
      usuarioId: 'user-1',
      rolId: 'rol-7',
      activo: true,
    });
    expect(mockAuthPermissionsService.invalidateUserCache).toHaveBeenCalledWith(
      'user-1'
    );
  });

  it('removeRoleFromUser lanza NotFoundException si no existe la asignación', async () => {
    mockUsuarioRolRepo.findOne.mockResolvedValue(null);

    await expect(
      service.removeRoleFromUser('user-2', 'rol-8')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getUserRoles lanza NotFoundException si el usuario no existe', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue(null);

    await expect(service.getUserRoles('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('findAllNoPagination devuelve solo roles activos', async () => {
    mockRolRepo.find.mockResolvedValue([{ id: 'rol-9' }]);

    const result = await service.findAllNoPagination();

    expect(mockRolRepo.find).toHaveBeenCalledWith({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
    expect(result).toEqual([{ id: 'rol-9' }]);
  });
});
