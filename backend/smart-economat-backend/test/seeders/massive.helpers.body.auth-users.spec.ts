import {
  buildAdminUserRoleBody,
  buildBodyAuthUsers,
} from '../../src/seeders/massive.helpers.body.auth-users';
import type { BuildBodyEnv } from '../../src/seeders/massive.helpers.body.shared';
import type { SeedContext } from '../../src/seeders/seed-context';

describe('massive.helpers.body.auth-users', () => {
  function createContext(initialState: Record<string, unknown>): SeedContext {
    const store = new Map<string, unknown>(Object.entries(initialState));
    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
    } as unknown as SeedContext;
  }

  function createEnv(
    context: SeedContext,
    overrides: Partial<BuildBodyEnv> = {}
  ): BuildBodyEnv {
    return {
      context,
      endpoint: {
        method: 'PATCH',
        path: '/admin/users/:id/role',
        source: 'spec',
      },
      resolvedPath: '/admin/users/user-1/role',
      iteration: 0,
      coverage: {} as BuildBodyEnv['coverage'],
      templatePath: '/admin/users/:id/role',
      runTag: 'spec',
      suffix: 'spec',
      roleValue: 'ALUMNO',
      statusValue: 'ACTIVO',
      unidadProducto: '',
      tipoProducto: '',
      alergeno: '',
      movimientoTipo: '',
      manualTipo: '',
      recetaDificultad: '',
      recetaUnidad: '',
      incidenciaTipo: '',
      incidenciaEstadoObjetivo: 'abierta',
      resolucionTipo: '',
      mermaMotivo: '',
      estadoVisual: '',
      estadoProducto: '',
      proveedorId: '',
      productoId: '',
      productoProveedorId: '',
      recetaId: '',
      pedidoId: '',
      inventarioId: '',
      recepcionId: '',
      ubicacionId: '',
      pedidoProductoId: '',
      usuarioId: 'user-1',
      roleId: 'role-admin',
      permissionId: 'perm-a',
      pickRequired: (key: string, offset = 0) => {
        const values = context.getState<string[]>(key) || [];
        return values[offset] ?? values[0] ?? '';
      },
      ...overrides,
    };
  }

  it('avoids reusing the current role and current additional permission', () => {
    const context = createContext({
      roleIds: ['role-admin', 'role-profesor', 'role-alumno'],
      permissionIds: ['perm-a', 'perm-b'],
      seedAdminUserRoleIdByUserId: {
        'user-1': 'role-admin',
      },
      seedAdminUserAdditionalPermissionIdsByUserId: {
        'user-1': ['perm-a'],
      },
    });

    const body = buildAdminUserRoleBody(createEnv(context));

    expect(body).toEqual({
      roleId: 'role-profesor',
      permisosAdicionalesIds: ['perm-b'],
      permisosExcluidosIds: [],
    });
  });

  it('uses the preferred role and permission when they are not already assigned', () => {
    const context = createContext({
      roleIds: ['role-admin', 'role-profesor', 'role-alumno'],
      permissionIds: ['perm-a', 'perm-b'],
      seedAdminUserRoleIdByUserId: {
        'user-1': 'role-alumno',
      },
      seedAdminUserAdditionalPermissionIdsByUserId: {
        'user-1': [],
      },
    });

    const body = buildAdminUserRoleBody(
      createEnv(context, {
        roleId: 'role-admin',
        permissionId: 'perm-a',
      })
    );

    expect(body).toEqual({
      roleId: 'role-admin',
      permisosAdicionalesIds: ['perm-a'],
      permisosExcluidosIds: [],
    });
  });

  it('buildBodyAuthUsers — PATCH perfil/mis-ubicaciones envía ubicacionesIds únicos y predicado incluido', () => {
    const u1 = '01900000-0000-7000-8000-000000000001';
    const u2 = '01900000-0000-7000-8000-000000000002';
    const context = createContext({
      ubicacionIds: [u1, u2, u1],
    });

    const body = buildBodyAuthUsers(
      createEnv(context, {
        resolvedPath: '/usuarios/perfil/mis-ubicaciones',
        templatePath: '/usuarios/perfil/mis-ubicaciones',
      })
    );

    expect(Array.isArray(body?.ubicacionesIds)).toBe(true);
    const ids = body?.ubicacionesIds as string[];
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids.every((id) => [u1, u2].includes(id))).toBe(true);
    expect(ids).toContain(body?.ubicacionPredeterminadaId);
  });
});
