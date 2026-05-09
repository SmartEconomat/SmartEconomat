import { BadRequestException, ConflictException } from '@nestjs/common';
import { PedidoService } from '../../../src/modules/pedido/service/pedido.service';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../../../src/modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { PedidoStatusTrigger } from '../../../src/modules/pedido/enums/pedido-status-trigger.enum';

describe('PedidoService', () => {
  const mockPedidoRepository = {
    findAllPaginated: jest.fn(),
    findOneWithRelations: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockMovimientoHelper = {
    trackPedidoCreation: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(48),
  };

  const mockPurchaseBatchService = {
    syncBatchStatus: jest.fn(),
  };

  const mockPedidoUsuarioService = {
    syncPedidoUsuarioStatus: jest.fn(),
  };

  let service: PedidoService;

  beforeEach(() => {
    jest.resetAllMocks();
    mockConfigService.get.mockReturnValue(48);
    service = new PedidoService(
      mockPedidoRepository as any,
      mockMovimientoHelper as any,
      mockDataSource as any,
      mockConfigService as any,
      mockPurchaseBatchService as any,
      mockPedidoUsuarioService as any
    );
  });

  function createQueryRunner() {
    const manager = {
      query: jest.fn().mockResolvedValue([{ max: '1999' }]),
      findOne: jest.fn().mockImplementation((_entity: any, options: any) => {
        const where = options?.where;
        if (where?.id === 'prov-1' || where?.id === 'prov-otro') {
          return Promise.resolve({ id: where.id });
        }
        if (where?.id === 'pp-1') {
          return Promise.resolve({
            id: 'pp-1',
            proveedorId: 'prov-1',
            precioUnitario: 2.5,
          });
        }
        if (where?.id === 'pp-1-otro') {
          return Promise.resolve({
            id: 'pp-1-otro',
            proveedorId: 'prov-otro',
            precioUnitario: 2.5,
          });
        }
        if (where?.id === 'pp-1-null') {
          return Promise.resolve({
            id: 'pp-1-null',
            proveedorId: 'prov-1',
            precioUnitario: null,
          });
        }
        if (where?.id === 'pp-2') {
          return Promise.resolve({
            id: 'pp-2',
            proveedorId: 'prov-1',
            precioUnitario: 1.2,
          });
        }
        if (where?.id === 'pp-3') {
          return Promise.resolve({
            id: 'pp-3',
            proveedorId: 'prov-1',
            precioUnitario: 3.5,
          });
        }
        return Promise.resolve(null);
      }),
      create: jest
        .fn()
        .mockImplementation((_: unknown, payload: Partial<Pedido>) => ({
          ...payload,
        })),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const queryRunner = {
      isTransactionActive: false,
      manager,
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockImplementation(() => {
        queryRunner.isTransactionActive = true;
        return Promise.resolve();
      }),
      commitTransaction: jest.fn().mockImplementation(() => {
        queryRunner.isTransactionActive = false;
        return Promise.resolve();
      }),
      rollbackTransaction: jest.fn().mockImplementation(() => {
        queryRunner.isTransactionActive = false;
        return Promise.resolve();
      }),
      release: jest.fn().mockResolvedValue(undefined),
    };

    mockDataSource.createQueryRunner.mockReturnValue(queryRunner);
    return queryRunner;
  }

  it('create calcula costeTotal, autogenera fechaEntrega y persiste líneas del pedido', async () => {
    const queryRunner = createQueryRunner();

    queryRunner.manager.save
      .mockImplementationOnce((_entity: unknown, pedido: Partial<Pedido>) =>
        Promise.resolve({
          id: 'pedido-1',
          numeroGlobal: '2001',
          ...pedido,
        })
      )
      .mockImplementation((_entity: unknown, entity: Partial<PedidoProducto>) =>
        Promise.resolve(entity)
      );

    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-1',
      numeroGlobal: '2001',
      costeTotal: 8.6,
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });

    const result = await service.create(
      {
        proveedorId: 'prov-1',
        observaciones: 'Entrega semanal',
        lineas: [
          { productoProveedorId: 'pp-1', cantidad: 2 },
          { productoProveedorId: 'pp-2', cantidad: 3 },
        ],
      } as any,
      'user-1'
    );

    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      Pedido,
      expect.objectContaining({
        estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        costeTotal: 8.6,
        observaciones: 'Entrega semanal',
        fechaEntrega: expect.any(Date),
      })
    );
    expect(mockMovimientoHelper.trackPedidoCreation).toHaveBeenCalledWith(
      'user-1',
      'pedido-1',
      expect.any(String),
      expect.objectContaining({ id: 'pedido-1' })
    );
    expect(result).toEqual({
      id: 'pedido-1',
      numeroGlobal: '2001',
      costeTotal: 8.6,
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });

    const pedidoGuardado = queryRunner.manager.save.mock.calls[0][1] as Pedido;
    const diffMs = pedidoGuardado.fechaEntrega!.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(47 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThan(49 * 60 * 60 * 1000);
  });

  it('create rechaza líneas de producto proveedor de otro proveedor', async () => {
    const queryRunner = createQueryRunner();

    await expect(
      service.create(
        {
          proveedorId: 'prov-1',
          lineas: [{ productoProveedorId: 'pp-1-otro', cantidad: 1 }],
        } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('create rechaza líneas sin precio vigente', async () => {
    const queryRunner = createQueryRunner();

    await expect(
      service.create(
        {
          proveedorId: 'prov-1',
          lineas: [{ productoProveedorId: 'pp-1-null', cantidad: 1 }],
        } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(ConflictException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('update rechaza payload con líneas vacías', async () => {
    const queryRunner = createQueryRunner();
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-2',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });

    await expect(
      service.update('pedido-2', { lineas: [] } as any)
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('update recalcula costeTotal cuando cambian las líneas', async () => {
    const queryRunner = createQueryRunner();
    const pedido = {
      id: 'pedido-3',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
      costeTotal: 0,
    } as Pedido;

    mockPedidoRepository.findOneWithRelations
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce({
        id: 'pedido-3',
        estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        costeTotal: 14,
      });

    queryRunner.manager.save.mockImplementation(
      (_entity: unknown, entity: any) => Promise.resolve(entity)
    );

    const result = await service.update('pedido-3', {
      lineas: [{ productoProveedorId: 'pp-3', cantidad: 4 }],
    } as any);

    expect(queryRunner.manager.delete).toHaveBeenCalledWith(PedidoProducto, {
      pedido: { id: 'pedido-3' },
    });
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'pedido-3',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
      costeTotal: 14,
    });
  });

  it.each([
    EstadoPedido.POR_RECEPCIONAR,
    EstadoPedido.PARCIAL,
    EstadoPedido.INCIDENCIA,
    EstadoPedido.RECEPCIONADO,
  ])('cancelarPedido rechaza el estado %s', async (estado) => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-4',
      estado,
    });

    await expect(
      service.cancelarPedido('pedido-4', {
        motivoCancelacion: 'No procede',
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancelarPedido rechaza pedidos con recepción iniciada aunque sigan pendientes', async () => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-4b',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
      recepcionesPedido: [{ id: 'rec-ped-1' }],
    });

    await expect(
      service.cancelarPedido('pedido-4b', {
        motivoCancelacion: 'No procede',
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handleStatusTransition pasa a PARCIAL con recepción parcial', async () => {
    mockPedidoRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 'pedido-6',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });
    mockPedidoRepository.save.mockImplementation((pedido: Pedido) =>
      Promise.resolve(pedido)
    );

    const result = await service.handleStatusTransition(
      'pedido-6',
      PedidoStatusTrigger.RECEPCION_PARCIAL
    );

    expect(result.estado).toBe(EstadoPedido.PARCIAL);
  });

  it('handleStatusTransition pasa a RECEPCIONADO con recepción total', async () => {
    mockPedidoRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 'pedido-7',
      estado: EstadoPedido.PARCIAL,
    });
    mockPedidoRepository.save.mockImplementation((pedido: Pedido) =>
      Promise.resolve(pedido)
    );

    const result = await service.handleStatusTransition(
      'pedido-7',
      PedidoStatusTrigger.RECEPCION_TOTAL
    );

    expect(result.estado).toBe(EstadoPedido.RECEPCIONADO);
  });

  it('handleStatusTransition rechaza disparadores no soportados', async () => {
    mockPedidoRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 'pedido-7b',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });

    await expect(
      service.handleStatusTransition('pedido-7b', 'DESCONOCIDO' as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateFechaEntrega es idempotente y devuelve el pedido', async () => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-8',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });

    await expect(
      service.updateFechaEntrega('pedido-8', {} as any)
    ).resolves.toEqual({
      id: 'pedido-8',
      estado: EstadoPedido.PENDIENTE_DE_APROBACION,
    });
  });

  it('remove rechaza pedidos que no estén pendientes o cancelados', async () => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-5',
      estado: EstadoPedido.RECEPCIONADO,
    });

    await expect(service.remove('pedido-5')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockPedidoRepository.remove).not.toHaveBeenCalled();
  });
});
