import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidenciaService } from '../../../src/modules/incidencia/service/incidencia.service';
import { TipoResolucion } from '../../../src/modules/incidencia/enums/incidencia.enums';
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
      lineas: [],
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

  it('resolverIncidenciaTransaccional con DEVOLUCION crea movimiento de salida ajuste', async () => {
    const incidencia = {
      id: 'inc-4',
      pedidoId: null,
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
    mockRecepcionRepo.findOne.mockResolvedValue(recepcion);
    mockRecepcionRepo.save.mockResolvedValue(recepcion);
    mockIncidenciaRepo.create.mockReturnValue({ id: 'inc-5' });
    mockIncidenciaRepo.save.mockResolvedValue({ id: 'inc-5' });

    const result = await service.reportarIncidencia({
      recepcionId: 'rec-1',
      tipo: 'FALTANTE',
    } as any);

    expect(recepcion.incidencia).toBe(true);
    expect(result).toEqual({ id: 'inc-5' });
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
