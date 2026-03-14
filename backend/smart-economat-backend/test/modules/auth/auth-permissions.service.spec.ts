import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Permiso } from '../../../src/modules/permisos/permiso.entity/permiso.entity';
import { AuthPermissionsService } from '../../../src/modules/auth/service/auth-permissions.service';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../../../src/modules/usuario/enums/usuario.enums';

describe('AuthPermissionsService', () => {
  let service: AuthPermissionsService;

  const mockUsuarioRepo = {
    findOne: jest.fn(),
  };

  const mockPermisoRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPermissionsService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepo,
        },
        {
          provide: getRepositoryToken(Permiso),
          useValue: mockPermisoRepo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthPermissionsService>(AuthPermissionsService);
  });

  function createPermisoQueryBuilder(result: Array<{ codigo: string }>) {
    return {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
    };
  }

  it('getUserPermissions usa caché cuando existe', async () => {
    mockCacheManager.get.mockResolvedValue(['productos:listar']);

    const result = await service.getUserPermissions('user-1');

    expect(result).toEqual(['productos:listar']);
    expect(mockPermisoRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(mockCacheManager.set).not.toHaveBeenCalled();
  });

  it('getUserPermissions hace cache miss, consulta BD y persiste TTL de 300 segundos', async () => {
    mockCacheManager.get.mockResolvedValue(undefined);
    const loadSpy = jest
      .spyOn(service as any, 'loadUserPermissionsFromDB')
      .mockResolvedValue(['pedidos:crear']);

    const result = await service.getUserPermissions('user-2');

    expect(result).toEqual(['pedidos:crear']);
    expect(loadSpy).toHaveBeenCalledWith('user-2');
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'user:permissions:user-2',
      ['pedidos:crear'],
      300
    );
  });

  it('loadUserPermissionsFromDB resuelve roles, plantilla, adicionales y excluidos con deduplicación', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue({
      id: 'user-3',
      rol: rolUsuario.ALUMNO,
      activo: true,
    });

    mockPermisoRepo.createQueryBuilder
      .mockReturnValueOnce(
        createPermisoQueryBuilder([
          { codigo: 'productos:listar' },
          { codigo: 'productos:crear' },
        ])
      )
      .mockReturnValueOnce(
        createPermisoQueryBuilder([
          { codigo: 'productos:listar' },
          { codigo: 'pedidos:crear' },
        ])
      )
      .mockReturnValueOnce(
        createPermisoQueryBuilder([{ codigo: 'usuarios:ver' }])
      )
      .mockReturnValueOnce(
        createPermisoQueryBuilder([{ codigo: 'productos:crear' }])
      );

    const result = await (service as any).loadUserPermissionsFromDB('user-3');

    expect(result).toEqual([
      'productos:listar',
      'pedidos:crear',
      'usuarios:ver',
    ]);
  });

  it('userHasAllPermissions devuelve false cuando falta algún permiso', async () => {
    jest
      .spyOn(service, 'getUserPermissions')
      .mockResolvedValue(['productos:listar', 'pedidos:crear']);

    await expect(
      service.userHasAllPermissions('user-4', [
        'productos:listar',
        'usuarios:eliminar',
      ])
    ).resolves.toBe(false);
  });

  it('userHasAnyPermission devuelve true cuando al menos uno coincide', async () => {
    jest
      .spyOn(service, 'getUserPermissions')
      .mockResolvedValue(['productos:listar']);

    await expect(
      service.userHasAnyPermission('user-5', [
        'usuarios:eliminar',
        'productos:listar',
      ])
    ).resolves.toBe(true);
  });

  it('userHasAllPermissions concede acceso cuando requiredPermissions está vacío', async () => {
    await expect(service.userHasAllPermissions('user-6', [])).resolves.toBe(
      true
    );
  });

  it('invalidateUserCache elimina la entrada y fuerza recarga en la siguiente consulta', async () => {
    mockCacheManager.get
      .mockResolvedValueOnce(['cacheado:permiso'])
      .mockResolvedValueOnce(undefined);

    const loadSpy = jest
      .spyOn(service as any, 'loadUserPermissionsFromDB')
      .mockResolvedValue(['permisos:frescos']);

    await service.getUserPermissions('user-7');
    await service.invalidateUserCache('user-7');
    const result = await service.getUserPermissions('user-7');

    expect(mockCacheManager.del).toHaveBeenCalledWith(
      'user:permissions:user-7'
    );
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['permisos:frescos']);
  });
});
