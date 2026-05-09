import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPermissionsService } from '../../../src/modules/auth/service/auth-permissions.service';
import { SherlockPermissionsGuard } from '../../../src/modules/sherlock-auth/guards/permissions.guard';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../../../src/modules/sherlock-auth/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../src/common/decorators/public.decorator';

describe('SherlockPermissionsGuard', () => {
  function createContext(user?: {
    id?: string;
    rol?: string;
  }): ExecutionContext {
    const handler = jest.fn();
    class TestController {}

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('permite rutas publicas', async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === IS_PUBLIC_KEY ? true : undefined
      ),
      get: jest.fn(),
    } as unknown as Reflector;

    const permissionsService = {
      userHasAllPermissions: jest.fn(),
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;

    const guard = new SherlockPermissionsGuard(reflector, permissionsService);
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('usa modo any cuando la metadata lo requiere', async () => {
    const userHasAnyPermission = jest.fn().mockResolvedValue(true);
    const permissionsService = {
      userHasAllPermissions: jest.fn(),
      userHasAnyPermission,
    } as unknown as AuthPermissionsService;
    const context = createContext({ id: 'user-any', rol: 'gestor' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_MODE_KEY) return 'any';
        return undefined;
      }),
      get: jest.fn((key: string, target: unknown) => {
        if (key !== PERMISSIONS_KEY) return undefined;
        if (target === handler) return ['pedidos:crear'];
        if (target === controller) return ['productos:listar'];
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new SherlockPermissionsGuard(reflector, permissionsService);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userHasAnyPermission).toHaveBeenCalledWith('user-any', [
      'productos:listar',
      'pedidos:crear',
    ]);
  });

  it('hace bypass para rol elevado', async () => {
    const userHasAllPermissions = jest.fn();
    const permissionsService = {
      userHasAllPermissions,
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;
    const context = createContext({ id: 'admin-1', rol: 'admin' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_MODE_KEY) return 'all';
        return undefined;
      }),
      get: jest.fn((key: string, target: unknown) => {
        if (key !== PERMISSIONS_KEY) return undefined;
        if (target === handler) return ['incidencias:listar'];
        if (target === controller) return ['usuarios:listar'];
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new SherlockPermissionsGuard(reflector, permissionsService);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userHasAllPermissions).not.toHaveBeenCalled();
  });

  it('deniega acceso cuando faltan permisos', async () => {
    const permissionsService = {
      userHasAllPermissions: jest.fn().mockResolvedValue(false),
      userHasAnyPermission: jest.fn(),
    } as unknown as AuthPermissionsService;
    const context = createContext({ id: 'user-locked', rol: 'cocinero' });
    const handler = context.getHandler();
    const controller = context.getClass();

    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === PERMISSIONS_MODE_KEY) return 'all';
        return undefined;
      }),
      get: jest.fn((key: string, target: unknown) => {
        if (key !== PERMISSIONS_KEY) return undefined;
        if (target === handler) return ['usuarios:eliminar'];
        if (target === controller) return ['usuarios:listar'];
        return undefined;
      }),
    } as unknown as Reflector;

    const guard = new SherlockPermissionsGuard(reflector, permissionsService);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
});
