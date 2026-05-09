import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidenciaService } from '../../../src/modules/incidencia/service/incidencia.service';
import {
  EstadoIncidencia,
  TipoResolucion,
  EstadoReclamacion,
} from '../../../src/modules/incidencia/enums/incidencia.enums';
import { EstadoFinalIncidenciaDto } from '../../../src/modules/incidencia/dto/resolver-incidencia.dto';
import { TipoMovimiento } from '../../../src/modules/movimiento/enums/movimiento.enums';

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
    log: jest.fn(),
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

  it('resolverIncidencia no deja la incidencia en estado resuelta', async () => {
    const incidencia = {
      id: 'inc-3',
      pedidoId: null,
      lineas: [
        {
          id: 'lin-1',
          pedidoProductoId: 'pp-1',
          cantidadPedida: 10,
          cantidadRecibida: 8,
          cantidadAjustada: 0,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: function () {
        return this.estado === 'RESUELTA';
      },
      estado: EstadoIncidencia.ABIERTA,
      fechaResolucion: null as Date | null,
    };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(incidencia)
        .mockResolvedValueOnce(incidencia),
      save: jest
        .fn()
        .mockImplementation((arg1, arg2) => Promise.resolve(arg2 || arg1)),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.resolverIncidencia('inc-3', {
      usuarioId: 'user-1',
      observacionesResolucion: 'ok',
      lineas: [
        {
          id: 'lin-1',
          cantidadRecibida: 10,
          cantidadAjustada: 0,
        },
      ],
    } as any);

    expect(incidencia.resolver).not.toHaveBeenCalled();
    expect(incidencia.estado).toBe(EstadoIncidencia.EN_PROCESO);
    expect(incidencia.fechaResolucion ?? null).toBeNull();
  });

  it('resolverIncidencia permite cierre manual en estado cancelada', async () => {
    const incidencia = {
      id: 'inc-3b',
      pedidoId: null,
      lineas: [
        {
          id: 'lin-1',
          pedidoProductoId: 'pp-1',
          cantidadPedida: 10,
          cantidadRecibida: 8,
          cantidadAjustada: 0,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: function () {
        return this.estado === 'RESUELTA';
      },
      estado: EstadoIncidencia.ABIERTA,
    };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(incidencia)
        .mockResolvedValueOnce(incidencia),
      save: jest
        .fn()
        .mockImplementation((arg1, arg2) => Promise.resolve(arg2 || arg1)),
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
          cantidadPedida: 10,
          cantidadRecibida: 8,
          cantidadAjustada: 0,
          estadoReclamacion: EstadoReclamacion.PENDIENTE,
        },
      ],
      resolver: jest.fn(),
      estaResuelta: function () {
        return this.estado === 'RESUELTA';
      },
      estado: EstadoIncidencia.ABIERTA,
    };
    const manager = {
      create: jest.fn().mockImplementation((_: unknown, payload: unknown) => ({
        ...((payload as object) || {}),
        estaResuelta: function () {
          return this.estado === 'RESUELTA';
        },
      })),
      save: jest
        .fn()
        .mockImplementation((arg1, arg2) => Promise.resolve(arg2 || arg1)),
    };
    jest.spyOn(service, 'findOne').mockResolvedValue(incidencia as any);
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.resolverIncidenciaTransaccional(
      'inc-4',
      { accion: TipoResolucion.DEVOLUCION, observaciones: 'dev' } as any,
      'user-2'
    );

    expect(mockMovimientoHelper.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        tipo: TipoMovimiento.SALIDA_AJUSTE,
        entidad: 'Incidencia',
        entidadId: 'inc-4',
      })
    );
  });

  it('reportarIncidencia activa el flag de recepción', async () => {
    const recepcion = { id: 'rec-1', incidencia: false };

    mockRecepcionRepo.findOne.mockResolvedValue(recepcion);
    const manager = {
      find: jest.fn().mockResolvedValue([
        {
          recepcionId: 'rec-1',
          pedidoProductoId: 'pp-1',
          cantidadRecibida: 8,
          pedidoProducto: {
            id: 'pp-1',
            cantidad: 10,
            pedido: { id: 'ped-1', proveedorId: 'prov-1' },
          },
          estadoProducto: 'PERFECTO',
          observaciones: undefined,
        },
      ]),
      create: jest.fn().mockImplementation((_: unknown, payload: unknown) => ({
        ...((payload as object) || {}),
        estaResuelta: function () {
          return this.estado === 'RESUELTA';
        },
        resolver: jest.fn(),
      })),
      save: jest.fn().mockImplementation((arg1: any, arg2?: any) => {
        const value = arg2 !== undefined ? arg2 : arg1;

        if (Array.isArray(value)) {
          return Promise.resolve(
            value.map((v) => ({ ...v, id: v.id || 'mock-id' }))
          );
        }

        if (value && typeof value === 'object') {
          if (!value.id && (value.recepcionId || value.pedidoId)) {
            value.id = 'inc-5';
          }
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
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('inc-5');
    expect(result[0].estado).toBe(EstadoIncidencia.ABIERTA);
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
          pedidoProducto: {
            id: 'pp-2',
            cantidad: 10,
            pedido: { id: 'ped-2', proveedorId: 'prov-2' },
          },
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
