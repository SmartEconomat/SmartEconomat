import type { SeedContext } from '../../src/seeders/seed-context';
import { refreshStateAfterOperation } from '../../src/seeders/massive.runtime.state-refresh';
import type { RequestResult } from '../../src/seeders/massive.types';

describe('massive.runtime.state-refresh', () => {
  function createContext(): SeedContext {
    const store = new Map<string, unknown>();
    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
    } as unknown as SeedContext;
  }

  function createResult(overrides: Partial<RequestResult>): RequestResult {
    return {
      ok: true,
      key: 'test',
      resolvedPath: '/pedidos',
      endpoint: {
        method: 'POST',
        path: '/pedidos',
        source: 'spec',
      },
      ...overrides,
    };
  }

  it('does not mark freshly created pedidos as receivable', async () => {
    const context = createContext();

    await refreshStateAfterOperation(
      context,
      createResult({
        resourceId: 'pedido-1',
      })
    );

    expect(context.getState<string[]>('seedCreatedPedidoPendienteIds')).toEqual(
      ['pedido-1']
    );
    expect(
      context.getState<string[]>('seedCreatedPedidoReceivableIds')
    ).toBeUndefined();
  });

  it('moves accepted pedidos from pending to receivable queues', async () => {
    const context = createContext();
    context.set('pedidoPendienteIds', ['pedido-1']);
    context.set('seedCreatedPedidoPendienteIds', ['pedido-1']);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'PATCH',
          path: '/pedidos/:id/aceptar',
          source: 'spec',
        },
        resolvedPath: '/pedidos/pedido-1/aceptar',
      })
    );

    expect(context.getState<string[]>('pedidoPendienteIds')).toEqual([]);
    expect(context.getState<string[]>('seedCreatedPedidoPendienteIds')).toEqual(
      []
    );
    expect(context.getState<string[]>('pedidoReceivableIds')).toEqual([
      'pedido-1',
    ]);
    expect(
      context.getState<string[]>('seedCreatedPedidoReceivableIds')
    ).toEqual(['pedido-1']);
  });

  it('removes receivable pedidos after a successful recepcion', async () => {
    const context = createContext();
    context.set('pedidoReceivableIds', ['pedido-1']);
    context.set('seedCreatedPedidoReceivableIds', ['pedido-1']);
    context.set('seedRecepcionPedidoId', 'pedido-1');

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'POST',
          path: '/recepciones',
          source: 'spec',
        },
        resolvedPath: '/recepciones',
        payload: {
          pedidos: [{ pedidoId: 'pedido-1' }],
        },
      })
    );

    expect(context.getState<string[]>('pedidoReceivableIds')).toEqual([]);
    expect(
      context.getState<string[]>('seedCreatedPedidoReceivableIds')
    ).toEqual([]);
    expect(context.getState<string>('seedRecepcionPedidoId')).toBe('');
  });

  it('tracks admin user role and permission state after a successful role patch', async () => {
    const context = createContext();
    context.set('usuarioPermisoAdicionalPairs', ['user-1|perm-old']);
    context.set('usuarioPermisoExcluidoPairs', ['user-1|perm-ex-old']);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'PATCH',
          path: '/admin/users/:id/role',
          source: 'spec',
        },
        resolvedPath: '/admin/users/user-1/role',
        payload: {
          roleId: 'role-admin',
          permisosAdicionalesIds: ['perm-new'],
          permisosExcluidosIds: ['perm-ex-new'],
        },
      })
    );

    expect(
      context.getState<Record<string, string>>('seedAdminUserRoleIdByUserId')
    ).toEqual({
      'user-1': 'role-admin',
    });
    expect(
      context.getState<Record<string, string[]>>(
        'seedAdminUserAdditionalPermissionIdsByUserId'
      )
    ).toEqual({
      'user-1': ['perm-new'],
    });
    expect(
      context.getState<Record<string, string[]>>(
        'seedAdminUserExcludedPermissionIdsByUserId'
      )
    ).toEqual({
      'user-1': ['perm-ex-new'],
    });
    expect(context.getState<string[]>('usuarioPermisoAdicionalPairs')).toEqual([
      'user-1|perm-new',
    ]);
    expect(context.getState<string[]>('usuarioPermisoExcluidoPairs')).toEqual([
      'user-1|perm-ex-new',
    ]);
  });

  it('removes deleted proveedores from active and deletable queues', async () => {
    const context = createContext();
    context.set('proveedorIds', ['proveedor-1', 'proveedor-2']);
    context.set('seedCreatedProveedorIds', ['proveedor-1']);
    context.set('seedCreatedDeletableProveedorIds', ['proveedor-1']);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'DELETE',
          path: '/proveedor/:id',
          source: 'spec',
        },
        resolvedPath: '/proveedor/proveedor-1',
      })
    );

    expect(context.getState<string[]>('proveedorIds')).toEqual(['proveedor-2']);
    expect(context.getState<string[]>('seedCreatedProveedorIds')).toEqual([]);
    expect(
      context.getState<string[]>('seedCreatedDeletableProveedorIds')
    ).toEqual([]);
  });

  it('removes deleted productos from reusable queues', async () => {
    const context = createContext();
    context.set('productoIds', ['producto-1', 'producto-2']);
    context.set('seedCreatedProductoIds', ['producto-1']);
    context.set('seedCreatedDeletableProductoIds', ['producto-1']);
    context.set('productoConProveedorIds', ['producto-1']);
    context.set('productoAlergenoPairs', [
      'producto-1|GLUTEN',
      'producto-2|SOJA',
    ]);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'DELETE',
          path: '/productos/:id',
          source: 'spec',
        },
        resolvedPath: '/productos/producto-1',
      })
    );

    expect(context.getState<string[]>('productoIds')).toEqual(['producto-2']);
    expect(context.getState<string[]>('seedCreatedProductoIds')).toEqual([]);
    expect(
      context.getState<string[]>('seedCreatedDeletableProductoIds')
    ).toEqual([]);
    expect(context.getState<string[]>('productoConProveedorIds')).toEqual([]);
    expect(context.getState<string[]>('productoAlergenoPairs')).toEqual([
      'producto-2|SOJA',
    ]);
  });

  it('removes deleted pedidos from reusable queues and relations', async () => {
    const context = createContext();
    context.set('pedidoIds', ['pedido-1', 'pedido-2']);
    context.set('pedidoPendienteIds', ['pedido-1']);
    context.set('seedCreatedPedidoPendienteIds', ['pedido-1']);
    context.set('pedidoReceivableIds', ['pedido-1']);
    context.set('seedCreatedPedidoReceivableIds', ['pedido-1']);
    context.set('pedidoUsuarioToPedidoPairs', [
      'pedido-usuario-1|pedido-1',
      'pedido-usuario-2|pedido-2',
    ]);
    context.set('pedidoProductoToPedidoPairs', [
      'pedido-producto-1|pedido-1',
      'pedido-producto-2|pedido-2',
    ]);
    context.set('pedidoProductoToPedidoPairsFresh', [
      'pedido-producto-1|pedido-1',
      'pedido-producto-2|pedido-2',
    ]);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'DELETE',
          path: '/pedidos/:id',
          source: 'spec',
        },
        resolvedPath: '/pedidos/pedido-1',
      })
    );

    expect(context.getState<string[]>('pedidoIds')).toEqual(['pedido-2']);
    expect(context.getState<string[]>('pedidoPendienteIds')).toEqual([]);
    expect(context.getState<string[]>('seedCreatedPedidoPendienteIds')).toEqual(
      []
    );
    expect(context.getState<string[]>('pedidoReceivableIds')).toEqual([]);
    expect(
      context.getState<string[]>('seedCreatedPedidoReceivableIds')
    ).toEqual([]);
    expect(context.getState<string[]>('pedidoUsuarioToPedidoPairs')).toEqual([
      'pedido-usuario-2|pedido-2',
    ]);
    expect(context.getState<string[]>('pedidoProductoToPedidoPairs')).toEqual([
      'pedido-producto-2|pedido-2',
    ]);
    expect(
      context.getState<string[]>('pedidoProductoToPedidoPairsFresh')
    ).toEqual(['pedido-producto-2|pedido-2']);
  });

  it('removes deleted recepciones from active and deletable queues', async () => {
    const context = createContext();
    context.set('recepcionIds', ['recepcion-1', 'recepcion-2']);
    context.set('seedCreatedDeletableRecepcionIds', ['recepcion-1']);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'DELETE',
          path: '/recepciones/:id',
          source: 'spec',
        },
        resolvedPath: '/recepciones/recepcion-1',
      })
    );

    expect(context.getState<string[]>('recepcionIds')).toEqual(['recepcion-2']);
    expect(
      context.getState<string[]>('seedCreatedDeletableRecepcionIds')
    ).toEqual([]);
  });

  it('removes pending pedido-usuario ids when all their child pedidos are consolidated', async () => {
    const context = createContext();
    context.set('pedidoPendienteIds', ['pedido-1', 'pedido-2']);
    context.set('seedCreatedPedidoPendienteIds', ['pedido-1', 'pedido-2']);
    context.set('pedidoUsuarioPendienteIds', ['pedido-usuario-1']);
    context.set('seedCreatedPedidoUsuarioPendienteIds', ['pedido-usuario-1']);
    context.set('pedidoUsuarioToPedidoPairs', [
      'pedido-usuario-1|pedido-1',
      'pedido-usuario-1|pedido-2',
    ]);

    await refreshStateAfterOperation(
      context,
      createResult({
        endpoint: {
          method: 'POST',
          path: '/purchase-batches/consolidate',
          source: 'spec',
        },
        resolvedPath: '/purchase-batches/consolidate',
        payload: {
          pedidoUsuarioIds: ['pedido-usuario-1'],
        },
      })
    );

    expect(context.getState<string[]>('pedidoPendienteIds')).toEqual([]);
    expect(context.getState<string[]>('seedCreatedPedidoPendienteIds')).toEqual(
      []
    );
    expect(context.getState<string[]>('pedidoUsuarioPendienteIds')).toEqual([]);
    expect(
      context.getState<string[]>('seedCreatedPedidoUsuarioPendienteIds')
    ).toEqual([]);
  });
});
