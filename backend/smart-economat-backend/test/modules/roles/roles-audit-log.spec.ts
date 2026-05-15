import { RolesService } from '../../../src/modules/roles/service/roles.service';

/**
 * Tests de regresión para ROLES-002:
 * assignRoleToUser y assignPermissions deben registrar cambios en el Logger.
 */
describe('RolesService — auditoría de cambios RBAC', () => {
  const mockRolRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    manager: { query: jest.fn() },
  };
  const mockUsuarioRepo = { findOne: jest.fn() };
  const mockPermisoRepo = { find: jest.fn() };
  const mockUsuarioRolRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
  };
  const mockAuthPermissionsService = {
    invalidateUserCache: jest.fn(),
    invalidateAllCache: jest.fn(),
  };

  let service: RolesService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RolesService(
      mockRolRepo as any,
      mockUsuarioRepo as any,
      mockPermisoRepo as any,
      mockUsuarioRolRepo as any,
      mockAuthPermissionsService as any
    );
    logSpy = jest
      .spyOn((service as any).logger, 'log')
      .mockImplementation(() => {});
  });

  describe('assignRoleToUser', () => {
    it('loguea cuando se asigna un rol nuevo', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({ id: 'u-1' });
      mockUsuarioRolRepo.findOne.mockResolvedValue(null);
      mockUsuarioRolRepo.create.mockReturnValue({
        usuarioId: 'u-1',
        rolId: 'r-1',
        activo: true,
      });
      mockUsuarioRolRepo.save.mockResolvedValue({
        usuarioId: 'u-1',
        rolId: 'r-1',
        activo: true,
      });
      mockAuthPermissionsService.invalidateUserCache.mockResolvedValue(
        undefined
      );

      await service.assignRoleToUser(
        { usuarioId: 'u-1', rolId: 'r-1' },
        'actor-id'
      );

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[RBAC]'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('actor-id'));
    });

    it('loguea cuando se actualiza un rol existente', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue({ id: 'u-1' });
      mockUsuarioRolRepo.findOne.mockResolvedValue({
        usuarioId: 'u-1',
        rolId: 'r-1',
        activo: true,
      });
      mockUsuarioRolRepo.save.mockResolvedValue({
        usuarioId: 'u-1',
        rolId: 'r-1',
        activo: false,
      });
      mockAuthPermissionsService.invalidateUserCache.mockResolvedValue(
        undefined
      );

      await service.assignRoleToUser(
        { usuarioId: 'u-1', rolId: 'r-1', activo: false },
        'admin-99'
      );

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[RBAC]'));
    });
  });

  describe('assignPermissions', () => {
    it('loguea cuando se asignan permisos a un rol', async () => {
      const mockRol = {
        id: 'r-1',
        nombre: 'Rol Test',
        esSistema: false,
        permisos: [],
      };
      mockRolRepo.findOne.mockResolvedValue(mockRol);
      mockPermisoRepo.find.mockResolvedValue([{ id: 'p-1' }]);
      mockRolRepo.save.mockResolvedValue(mockRol);
      mockRolRepo.manager.query.mockResolvedValue(undefined);
      mockUsuarioRolRepo.find.mockResolvedValue([]);
      mockAuthPermissionsService.invalidateUserCache.mockResolvedValue(
        undefined
      );
      mockAuthPermissionsService.invalidateAllCache = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.assignPermissions(
        'r-1',
        { permisoIds: ['p-1'] },
        'actor-123'
      );

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[RBAC]'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('actor-123'));
    });
  });
});
