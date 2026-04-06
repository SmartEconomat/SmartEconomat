import AppDataSource from '../../src/config/typeorm.config';
import { Pedido } from '../../src/modules/pedido/pedido.entity/pedido.entity';
import { Recepcion } from '../../src/modules/recepcion/recepcion.entity/recepcion.entity';
import { Producto } from '../../src/modules/producto/producto.entity/producto.entity';
import type { Repository } from 'typeorm';
import type { SeedContext } from '../../src/seeders/seed-context';
import { ALERGEN_VALUES } from '../../src/seeders/massive.config';
import {
  ensureDeletablePedidoResource,
  ensureDeletableProductoResource,
  ensureDeletableProductoAlergenoResource,
  ensureDeletableRecepcionResource,
} from '../../src/seeders/massive.runtime.deletables';

describe('massive.runtime.deletables producto-alergeno', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createContext(initialState: Record<string, unknown>): SeedContext & {
    requestJson: jest.Mock;
  } {
    const store = new Map<string, unknown>(Object.entries(initialState));
    let activeToken = 'seed-active-token';

    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
      getAccessToken: () => activeToken,
      setAccessToken: (token: string) => {
        activeToken = token;
      },
      getSessionTokensByPrefix: jest.fn(() => []),
      requestJson: jest.fn(),
    } as unknown as SeedContext & { requestJson: jest.Mock };
  }

  it('reuses an existing producto-alergeno pair returned by HTTP', async () => {
    const context = createContext({
      seedTokenSuperAdmin: 'super-token',
      productoIds: ['producto-1'],
    });
    context.requestJson.mockResolvedValueOnce([
      {
        idProducto: 'producto-1',
        alergeno: 'GLUTEN',
      },
    ]);

    await ensureDeletableProductoAlergenoResource(context, 0);

    expect(context.requestJson).toHaveBeenCalledTimes(1);
    expect(
      context.getState<string[]>('seedCreatedDeletableProductoAlergenoPairs')
    ).toEqual(['producto-1|GLUTEN']);
  });

  it('creates a new producto-alergeno pair when none exists yet', async () => {
    const context = createContext({
      seedTokenSuperAdmin: 'super-token',
      productoIds: ['producto-1'],
    });
    context.requestJson.mockResolvedValueOnce([]).mockResolvedValueOnce({
      idProducto: 'producto-1',
      alergeno: ALERGEN_VALUES[0],
    });

    await ensureDeletableProductoAlergenoResource(context, 0);

    expect(context.requestJson).toHaveBeenCalledTimes(2);
    expect(context.requestJson.mock.calls[1][0]).toBe('/producto-alergenos');
    expect(context.requestJson.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: {
        idProducto: 'producto-1',
        alergeno: ALERGEN_VALUES[0],
      },
    });
    expect(
      context.getState<string[]>('seedCreatedDeletableProductoAlergenoPairs')
    ).toEqual([`producto-1|${ALERGEN_VALUES[0]}`]);
  });

  it('creates a recepcion without relations for delete routes', async () => {
    const context = createContext({
      seedTokenSuperAdmin: 'super-token',
      usuarioIds: ['usuario-1'],
    });
    const create = jest.fn().mockReturnValue({
      fechaRecepcion: new Date('2026-04-01T00:00:00.000Z'),
      observaciones: 'Recepción deletable generada por seed',
      usuarioId: 'usuario-1',
      incidencia: false,
    });
    const save = jest.fn().mockResolvedValue({ id: 'recepcion-1' });

    jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockReturnValue({ create, save } as unknown as Repository<Recepcion>);

    await ensureDeletableRecepcionResource(context, 0);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        observaciones: 'Recepción deletable generada por seed',
        usuarioId: 'usuario-1',
        incidencia: false,
      })
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(context.requestJson).not.toHaveBeenCalled();
    expect(
      context.getState<string[]>('seedCreatedDeletableRecepcionIds')
    ).toEqual(['recepcion-1']);
  });

  it('creates a pedido deletable with reserved numeroGlobal', async () => {
    const context = createContext({});
    const create = jest.fn().mockImplementation((payload) => payload);
    const save = jest.fn().mockResolvedValue({
      id: 'pedido-1',
      numeroGlobal: '200123',
    });
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ max: '199999' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ value: '200000' }])
        .mockResolvedValueOnce([]),
    };

    jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource);
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      create,
      save,
      manager,
    } as unknown as Repository<Pedido>);

    await ensureDeletablePedidoResource(context, {} as never, 0);

    expect(manager.query).toHaveBeenCalledTimes(6);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroGlobal: '200000',
        observaciones: 'Pedido deletable generado por seed',
      })
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(context.getState<string[]>('seedCreatedDeletablePedidoIds')).toEqual(
      ['pedido-1']
    );
  });

  it('creates a dedicated deletable producto outside reusable created pools', async () => {
    const context = createContext({});
    const create = jest.fn().mockImplementation((payload) => payload);
    const save = jest.fn().mockResolvedValue({ id: 'producto-eliminable-1' });

    jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockReturnValue({ create, save } as unknown as Repository<Producto>);

    await ensureDeletableProductoResource(context, {} as never, 0);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: expect.stringMatching(/^Producto deletable seed /),
        contenido: 1,
      })
    );
    expect(
      context.getState<string[]>('seedCreatedDeletableProductoIds')
    ).toEqual(['producto-eliminable-1']);
    expect(context.getState<string[]>('productoIds')).toEqual([
      'producto-eliminable-1',
    ]);
  });
});
