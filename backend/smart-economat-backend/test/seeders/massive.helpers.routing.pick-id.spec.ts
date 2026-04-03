import { pickIdForRoute } from '../../src/seeders/massive.helpers.routing.pick-id';
import type { SeedContext } from '../../src/seeders/seed-context';

describe('massive.helpers.routing.pick-id', () => {
  function createContext(initialState: Record<string, unknown>): SeedContext {
    const store = new Map<string, unknown>(Object.entries(initialState));
    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
    } as unknown as SeedContext;
  }

  it('avoids selecting the fixed alumno for profesores/alumnos mutations when other alumnos exist', () => {
    const context = createContext({
      seedFixedAlumnoId: 'alumno-fixed',
      seedProfesorActorCount: 1,
      'seedProfesorOwnedAlumnoIds:0': JSON.stringify([
        'alumno-fixed',
        'alumno-extra-1',
        'alumno-extra-2',
      ]),
      alumnoIds: ['alumno-fixed', 'alumno-extra-1', 'alumno-extra-2'],
    });

    const selectedId = pickIdForRoute(
      context,
      '/profesores/alumnos/:id/force-reset',
      'POST',
      0
    );

    expect(selectedId).toBe('alumno-extra-1');
  });

  it('uses listed pedido ids for GET /pedidos/:id before pending-created ids', () => {
    const context = createContext({
      pedidoIds: ['pedido-historico-1', 'pedido-historico-2'],
      pedidoListIds: ['pedido-listado-1', 'pedido-listado-2'],
      seedCreatedPedidoPendienteIds: ['pedido-pendiente-reciente'],
    });

    const selectedId = pickIdForRoute(context, '/pedidos/:id', 'GET', 0);

    expect(selectedId).toBe('pedido-listado-1');
  });

  it('keeps using pending-created pedido ids for mutating /pedidos/:id routes', () => {
    const context = createContext({
      pedidoIds: ['pedido-listado-1'],
      seedCreatedPedidoPendienteIds: ['pedido-pendiente-reciente'],
    });

    const selectedId = pickIdForRoute(context, '/pedidos/:id', 'PATCH', 0);

    expect(selectedId).toBe('pedido-pendiente-reciente');
  });

  it('uses pending pedido ids from the last listado for aceptar before historical pending ids', () => {
    const context = createContext({
      pedidoPendingListIds: ['pedido-pendiente-listado'],
      pedidoPendienteIds: ['pedido-pendiente-global'],
      seedCreatedPedidoPendienteIds: ['pedido-pendiente-reciente'],
    });

    const selectedId = pickIdForRoute(
      context,
      '/pedidos/:id/aceptar',
      'PATCH',
      0
    );

    expect(selectedId).toBe('pedido-pendiente-listado');
  });

  it('prioritizes prepared pending pedido ids for cancelar', () => {
    const context = createContext({
      seedPreparedPedidoPendienteIds: ['pedido-pendiente-preparado'],
      pedidoPendingListIds: ['pedido-pendiente-listado'],
      pedidoPendienteIds: ['pedido-pendiente-global'],
      seedCreatedPedidoPendienteIds: ['pedido-pendiente-reciente'],
    });

    const selectedId = pickIdForRoute(
      context,
      '/pedidos/:id/cancelar',
      'PATCH',
      0
    );

    expect(selectedId).toBe('pedido-pendiente-preparado');
  });

  it('falls back to global pending pedido ids before historical created ids for cancelar', () => {
    const context = createContext({
      pedidoPendingListIds: [],
      pedidoPendienteIds: ['pedido-pendiente-global'],
      seedCreatedPedidoPendienteIds: ['pedido-pendiente-reciente'],
    });

    const selectedId = pickIdForRoute(
      context,
      '/pedidos/:id/cancelar',
      'PATCH',
      0
    );

    expect(selectedId).toBe('pedido-pendiente-global');
  });

  it('uses deletable profesor slot ids for DELETE /profesores/slots/:id', () => {
    const context = createContext({
      seedCreatedDeletableProfesorSlotIds: ['slot-eliminable-1'],
      profesorSlotIds: ['slot-ocupado-1'],
    });

    const selectedId = pickIdForRoute(
      context,
      '/profesores/slots/:id',
      'DELETE',
      0
    );

    expect(selectedId).toBe('slot-eliminable-1');
  });

  it('uses deletable pedido ids for DELETE /pedidos/:id', () => {
    const context = createContext({
      seedCreatedDeletablePedidoIds: ['pedido-eliminable-1'],
      pedidoPendienteIds: ['pedido-pendiente-1'],
    });

    const selectedId = pickIdForRoute(context, '/pedidos/:id', 'DELETE', 0);

    expect(selectedId).toBe('pedido-eliminable-1');
  });

  it('uses dedicated deletable producto ids for DELETE /productos/:id', () => {
    const context = createContext({
      seedCreatedDeletableProductoIds: ['producto-eliminable-1'],
      seedCreatedProductoIds: ['producto-usado-1'],
      productoIds: ['producto-usado-1'],
    });

    const selectedId = pickIdForRoute(context, '/productos/:id', 'DELETE', 0);

    expect(selectedId).toBe('producto-eliminable-1');
  });
});
