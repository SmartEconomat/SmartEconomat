import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { AuthPermissionsGuard } from '../../../src/modules/auth/guards/auth-permissions.guard';
import { AuthPermissionsService } from '../../../src/modules/auth/service/auth-permissions.service';
import { JwtStrategy } from '../../../src/modules/auth/strategies/jwt.strategy';
import {
  rolUsuario,
  UserStatus,
} from '../../../src/modules/usuario/enums/usuario.enums';

describe('Auth guards and strategy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  function createExecutionContext(user?: Record<string, unknown>) {
    const handler = jest.fn();
    class TestController {}

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('JwtAuthGuard permite rutas marcadas como públicas', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);
    const parentCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate'
    );

    expect(guard.canActivate(createExecutionContext())).toBe(true);
    expect(parentCanActivate).not.toHaveBeenCalled();
  });

  it('JwtAuthGuard delega al guard base y propaga 401 cuando no hay token', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);
    jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockImplementation(() => {
        throw new UnauthorizedException();
      });

    expect(() => guard.canActivate(createExecutionContext())).toThrow(
      UnauthorizedException
    );
  });

  it('AuthPermissionsGuard permite rutas públicas sin validar permisos', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
      get: jest.fn(),
    } as unknown as Reflector;

    const permissionsService = {
      userHasAllPermissions: jest.fn(),
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;

    const guard = new AuthPermissionsGuard(reflector, permissionsService);

    await expect(guard.canActivate(createExecutionContext())).resolves.toBe(
      true
    );
  });

  it('AuthPermissionsGuard usa lógica AND por defecto', async () => {
    const userHasAllPermissions = jest.fn().mockResolvedValue(true);
    const permissionsService = {
      userHasAllPermissions,
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;
    const context = createExecutionContext({ id: 'user-1', nombre: 'Ada' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn().mockImplementation((key: string) => {
        if (key === 'isPublic') {
          return false;
        }
        if (key === 'permissions_mode') {
          return 'all';
        }
        return undefined;
      }),
      get: jest.fn().mockImplementation((key: string, target: unknown) => {
        if (key !== 'permissions') {
          return undefined;
        }
        if (target === handler) {
          return ['pedidos:crear'];
        }
        if (target === controller) {
          return ['productos:listar'];
        }
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new AuthPermissionsGuard(reflector, permissionsService);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userHasAllPermissions.mock.calls[0]).toEqual([
      'user-1',
      ['productos:listar', 'pedidos:crear'],
    ]);
  });

  it('AuthPermissionsGuard usa lógica OR cuando la metadata lo indica', async () => {
    const userHasAnyPermission = jest.fn().mockResolvedValue(true);
    const permissionsService = {
      userHasAllPermissions: jest.fn(),
      userHasAnyPermission,
    } as unknown as AuthPermissionsService;
    const context = createExecutionContext({ id: 'user-2', nombre: 'Linus' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn().mockImplementation((key: string) => {
        if (key === 'isPublic') {
          return false;
        }
        if (key === 'permissions_mode') {
          return 'any';
        }
        return undefined;
      }),
      get: jest.fn().mockImplementation((key: string, target: unknown) => {
        if (key !== 'permissions') {
          return undefined;
        }
        if (target === handler) {
          return ['pedidos:crear'];
        }
        if (target === controller) {
          return ['incidencias:ver'];
        }
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new AuthPermissionsGuard(reflector, permissionsService);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userHasAnyPermission.mock.calls[0]).toEqual([
      'user-2',
      ['incidencias:ver', 'pedidos:crear'],
    ]);
  });

  it('AuthPermissionsGuard devuelve 403 con detalle cuando faltan permisos', async () => {
    const permissionsService = {
      userHasAllPermissions: jest.fn().mockResolvedValue(false),
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;
    const context = createExecutionContext({ id: 'user-3', nombre: 'Grace' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn().mockImplementation((key: string) => {
        if (key === 'isPublic') {
          return false;
        }
        if (key === 'permissions_mode') {
          return 'all';
        }
        return undefined;
      }),
      get: jest.fn().mockImplementation((key: string, target: unknown) => {
        if (key !== 'permissions') {
          return undefined;
        }
        if (target === handler) {
          return ['usuarios:restaurar'];
        }
        if (target === controller) {
          return ['usuarios:eliminar'];
        }
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new AuthPermissionsGuard(reflector, permissionsService);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        requiredPermissions: ['usuarios:eliminar', 'usuarios:restaurar'],
        mode: 'all',
      },
    });
  });

  it('AuthPermissionsGuard rechaza cuando no hay usuario autenticado', async () => {
    const permissionsService = {
      userHasAllPermissions: jest.fn(),
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;

    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue(['usuarios:listar']),
    } as unknown as Reflector;

    const guard = new AuthPermissionsGuard(reflector, permissionsService);

    await expect(
      guard.canActivate(createExecutionContext())
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('JwtStrategy valida el payload y retorna el usuario autenticado', async () => {
    const usuarioRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-4',
        username: 'admin',
        rol: rolUsuario.ADMIN,
        status: UserStatus.ACTIVE,
      }),
    };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    const strategy = new JwtStrategy(usuarioRepo as any, configService as any);
    const result = await strategy.validate({
      sub: 'user-4',
      username: 'admin',
      role: rolUsuario.ADMIN,
    });

    expect(usuarioRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'user-4', status: UserStatus.ACTIVE },
    });
    expect(result).toEqual({
      id: 'user-4',
      username: 'admin',
      rol: rolUsuario.ADMIN,
    });
  });

  it('JwtStrategy lanza 401 cuando el usuario no existe o no está activo', async () => {
    const usuarioRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    const strategy = new JwtStrategy(usuarioRepo as any, configService as any);

    await expect(
      strategy.validate({
        sub: 'missing-user',
        username: 'missing',
        role: rolUsuario.ALUMNO,
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
