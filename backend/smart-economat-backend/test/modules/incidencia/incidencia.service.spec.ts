import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidenciaService } from '../../../src/modules/incidencia/service/incidencia.service';
import {
  EstadoIncidencia,
  TipoResolucion,
} from '../../../src/modules/incidencia/enums/incidencia.enums';
import { EstadoFinalIncidenciaDto } from '../../../src/modules/incidencia/dto/resolver-incidencia.dto';
import { TipoMovimiento } from '../../../src/modules/movimiento/enums/movimiento.enums';
import {
  EstadoReclamacion,
  TipoDiferencia,
} from '../../../src/modules/incidencia/incidencia-linea.entity/incidencia-linea.entity';

describe('IncidenciaService', () => {
  const mockIncidenciaRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAllPaginated: jest.fn(),
    findOneWithRelations: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };
  const mockRecepcionRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };
  const mockMovimientoHelper = {
    createMovimiento: jest.fn(),
  };
  const mockPedidoService = {
    handleStatusTransition: jest.fn(),
  };

  let service: IncidenciaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IncidenciaService(
      mockIncidenciaRepo as any,
      mockRecepcionRepo as any,
      mockDataSource as any,
      mockMovimientoHelper as any,
      mockPedidoService as any
    );
  });

  it('update prohíbe editar incidencias resueltas', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ estaResuelta: () => true } as any);

    await expect(service.update('inc-1', {} as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('remove prohíbe eliminar incidencias resueltas', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ estaResuelta: () => true } as any);

    await expect(service.remove('inc-2')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('resolverIncidencia marca fecha y usuario resolutor', async () => {
    const incidencia = {
      id: 'inc-3',
      pedidoId: null,
      lineas: [
        {
          id: 'lin-1',
          pedidoProductoId: 'pp-1',
          cantidadEsperada: 10,
          cantidadRecibida: 8,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: () => false,
    };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(incidencia)
        .mockResolvedValueOnce(incidencia),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.resolverIncidencia('inc-3', {
      usuarioId: 'user-1',
      observacionesResolucion: 'ok',
    } as any);

    expect(incidencia.resolver).toHaveBeenCalledWith('user-1', 'ok');
  });

  it('resolverIncidencia permite cierre manual en estado cancelada', async () => {
    const incidencia = {
      id: 'inc-3b',
      pedidoId: null,
      lineas: [
        {
          id: 'lin-1',
          pedidoProductoId: 'pp-1',
          cantidadEsperada: 10,
          cantidadRecibida: 8,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: () => false,
    };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(incidencia)
        .mockResolvedValueOnce(incidencia),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.resolverIncidencia('inc-3b', {
      usuarioId: 'user-1',
      observacionesResolucion: 'cancelada por proveedor',
      estadoFinal: EstadoFinalIncidenciaDto.CANCELADA,
    } as any);

    expect(incidencia.resolver).toHaveBeenCalledWith(
      'user-1',
      expect.stringContaining('[cancelada]')
    );
  });

  it('resolverIncidenciaTransaccional con DEVOLUCION crea movimiento de salida ajuste', async () => {
    const incidencia = {
      id: 'inc-4',
      pedidoId: null,
      lineas: [
        {
          id: 'lin-1',
          pedidoProductoId: 'pp-1',
          cantidadEsperada: 10,
          cantidadRecibida: 8,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: () => false,
    };
    const manager = {
      create: jest
        .fn()
        .mockImplementation((_: unknown, payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((value: unknown) => Promise.resolve(value)),
    };
    jest.spyOn(service, 'findOne').mockResolvedValue(incidencia as any);
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.resolverIncidenciaTransaccional(
      'inc-4',
      { accion: TipoResolucion.DEVOLUCION, observaciones: 'dev' } as any,
      'user-2'
    );

    expect(mockMovimientoHelper.createMovimiento).toHaveBeenCalledWith(
      'user-2',
      TipoMovimiento.SALIDA_AJUSTE,
      'Incidencia',
      'inc-4',
      0,
      undefined,
      undefined,
      expect.stringContaining('dev')
    );
  });

  it('reportarIncidencia activa el flag de recepción', async () => {
    const recepcion = { id: 'rec-1', incidencia: false };
    const lineaPersistida = {
      id: 'lin-1',
      pedidoProductoId: 'pp-1',
      cantidadEsperada: 10,
      cantidadRecibida: 8,
      diferencia: -2,
      tipoDiferencia: TipoDiferencia.FALTANTE,
      estadoReclamacion: EstadoReclamacion.PENDIENTE,
      observaciones: undefined,
    };

    mockRecepcionRepo.findOne.mockResolvedValue(recepcion);
    const manager = {
      find: jest.fn().mockResolvedValue([
        {
          recepcionId: 'rec-1',
          pedidoProductoId: 'pp-1',
          cantidadRecibida: 8,
          pedidoProducto: { id: 'pp-1', cantidad: 10 },
          estadoProducto: 'PERFECTO',
          observaciones: undefined,
        },
      ]),
      create: jest.fn().mockImplementation((_: unknown, payload: unknown) => ({
        ...((payload as object) || {}),
      })),
      save: jest
        .fn()
        .mockImplementation((entity: unknown, maybeValue?: unknown) => {
          const value = maybeValue ?? entity;

          if (Array.isArray(value)) {
            if (value.length > 0 && value[0].pedidoProducto) {
              return Promise.resolve([lineaPersistida]);
            }

            return Promise.resolve(value);
          }

          if ((value as any)?.recepcion) {
            return Promise.resolve({
              ...(value as any),
              id: 'inc-5',
              estaResuelta: () => false,
              lineas: [],
            });
          }

          if ((value as any)?.id === 'rec-1') {
            return Promise.resolve(value);
          }

          return Promise.resolve(value);
        }),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.reportarIncidencia({
      recepcionId: 'rec-1',
      tipo: 'FALTANTE',
    } as any);

    expect(recepcion.incidencia).toBe(true);
    expect(result.id).toBe('inc-5');
    expect(result.lineas).toHaveLength(1);
    expect(result.estado).toBe(EstadoIncidencia.NUEVA);
  });

  it('reportarIncidencia rechaza cuando no hay discrepancias', async () => {
    const recepcion = { id: 'rec-2', incidencia: false };
    mockRecepcionRepo.findOne.mockResolvedValue(recepcion);
    const manager = {
      find: jest.fn().mockResolvedValue([
        {
          recepcionId: 'rec-2',
          pedidoProductoId: 'pp-2',
          cantidadRecibida: 10,
          pedidoProducto: { id: 'pp-2', cantidad: 10 },
          estadoProducto: 'PERFECTO',
          observaciones: undefined,
        },
      ]),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.reportarIncidencia({
        recepcionId: 'rec-2',
        tipo: 'FALTANTE',
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reportarIncidencia lanza NotFoundException si la recepción no existe', async () => {
    mockRecepcionRepo.findOne.mockResolvedValue(null);

    await expect(
      service.reportarIncidencia({
        recepcionId: 'missing',
        tipo: 'FALTANTE',
      } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
