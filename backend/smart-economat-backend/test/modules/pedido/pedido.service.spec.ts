import { BadRequestException, ConflictException } from '@nestjs/common';
import { PedidoService } from '../../../src/modules/pedido/service/pedido.service';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../../../src/modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { PedidoStatusTrigger } from '../../../src/modules/pedido/enums/pedido-status-trigger.enum';

describe('PedidoService', () => {
  const mockPedidoRepository = {
    findAllPaginated: jest.fn(),
    findOneWithRelations: jest.fn(),
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

  let service: PedidoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PedidoService(
      mockPedidoRepository as any,
      mockMovimientoHelper as any,
      mockDataSource as any,
      mockConfigService as any
    );
  });

  function createQueryRunner() {
    const manager = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((_: unknown, payload: Partial<Pedido>) => ({
          ...payload,
        })),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const queryRunner = {
      manager,
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    mockDataSource.createQueryRunner.mockReturnValue(queryRunner);
    return queryRunner;
  }

  it('create calcula costeTotal, autogenera fechaEntrega y persiste líneas del pedido', async () => {
    const queryRunner = createQueryRunner();

    queryRunner.manager.findOne
      .mockResolvedValueOnce({
        id: 'pp-1',
        proveedorId: 'prov-1',
        precioUnitario: 2.5,
      } as ProductoProveedor)
      .mockResolvedValueOnce({
        id: 'pp-2',
        proveedorId: 'prov-1',
        precioUnitario: 1.2,
      } as ProductoProveedor);

    queryRunner.manager.save
      .mockImplementationOnce((_entity: unknown, pedido: Partial<Pedido>) =>
        Promise.resolve({
          id: 'pedido-1',
          ...pedido,
        })
      )
      .mockImplementation((_entity: unknown, entity: Partial<PedidoProducto>) =>
        Promise.resolve(entity)
      );

    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-1',
      costeTotal: 8.6,
      estado: EstadoPedido.PENDIENTE,
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
        estado: EstadoPedido.PENDIENTE,
        costeTotal: 8.6,
        observaciones: 'Entrega semanal',
        fechaEntrega: expect.any(Date),
      })
    );
    expect(mockMovimientoHelper.trackPedidoCreation).toHaveBeenCalledWith(
      'user-1',
      'pedido-1',
      'Creación de pedido #pedido-1'
    );
    expect(result).toEqual({
      id: 'pedido-1',
      costeTotal: 8.6,
      estado: EstadoPedido.PENDIENTE,
    });

    const pedidoGuardado = queryRunner.manager.save.mock.calls[0][1] as Pedido;
    const diffMs = pedidoGuardado.fechaEntrega!.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(47 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThan(49 * 60 * 60 * 1000);
  });

  it('create rechaza líneas de producto proveedor de otro proveedor', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne.mockResolvedValue({
      id: 'pp-1',
      proveedorId: 'prov-otro',
      precioUnitario: 2,
    } as ProductoProveedor);

    await expect(
      service.create(
        {
          proveedorId: 'prov-1',
          lineas: [{ productoProveedorId: 'pp-1', cantidad: 1 }],
        } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('create rechaza líneas sin precio vigente', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne.mockResolvedValue({
      id: 'pp-1',
      proveedorId: 'prov-1',
      precioUnitario: null,
    } as unknown as ProductoProveedor);

    await expect(
      service.create(
        {
          proveedorId: 'prov-1',
          lineas: [{ productoProveedorId: 'pp-1', cantidad: 1 }],
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
      estado: EstadoPedido.PENDIENTE,
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
      estado: EstadoPedido.PENDIENTE,
      costeTotal: 0,
    } as Pedido;

    mockPedidoRepository.findOneWithRelations
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce({
        id: 'pedido-3',
        estado: EstadoPedido.PENDIENTE,
        costeTotal: 14,
      });

    queryRunner.manager.findOne.mockResolvedValue({
      id: 'pp-3',
      precioUnitario: 3.5,
    } as ProductoProveedor);
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
      estado: EstadoPedido.PENDIENTE,
      costeTotal: 14,
    });
  });

  it.each([EstadoPedido.EN_PROCESO, EstadoPedido.RECIBIDO])(
    'cancelarPedido rechaza el estado %s',
    async (estado) => {
      mockPedidoRepository.findOneWithRelations.mockResolvedValue({
        id: 'pedido-4',
        estado,
      });

      await expect(
        service.cancelarPedido('pedido-4', {
          motivoCancelacion: 'No procede',
        } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  );

  it('cancelarPedido rechaza pedidos con recepción iniciada aunque sigan pendientes', async () => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-4b',
      estado: EstadoPedido.PENDIENTE,
      recepcionesPedido: [{ id: 'rec-ped-1' }],
    });

    await expect(
      service.cancelarPedido('pedido-4b', {
        motivoCancelacion: 'No procede',
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handleStatusTransition pasa a EN_PROCESO con recepción parcial', async () => {
    mockPedidoRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 'pedido-6',
      estado: EstadoPedido.PENDIENTE,
    });
    mockPedidoRepository.save.mockImplementation((pedido: Pedido) =>
      Promise.resolve(pedido)
    );

    const result = await service.handleStatusTransition(
      'pedido-6',
      PedidoStatusTrigger.RECEPCION_PARCIAL
    );

    expect(result.estado).toBe(EstadoPedido.EN_PROCESO);
  });

  it('handleStatusTransition pasa a RECIBIDO con recepción total', async () => {
    mockPedidoRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 'pedido-7',
      estado: EstadoPedido.EN_PROCESO,
    });
    mockPedidoRepository.save.mockImplementation((pedido: Pedido) =>
      Promise.resolve(pedido)
    );

    const result = await service.handleStatusTransition(
      'pedido-7',
      PedidoStatusTrigger.RECEPCION_TOTAL
    );

    expect(result.estado).toBe(EstadoPedido.RECIBIDO);
  });

  it('updateFechaEntrega bloquea la edición manual', () => {
    expect(() => service.updateFechaEntrega('pedido-8', {} as any)).toThrow(
      BadRequestException
    );
  });

  it('remove rechaza pedidos que no estén pendientes o cancelados', async () => {
    mockPedidoRepository.findOneWithRelations.mockResolvedValue({
      id: 'pedido-5',
      estado: EstadoPedido.RECIBIDO,
    });

    await expect(service.remove('pedido-5')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockPedidoRepository.remove).not.toHaveBeenCalled();
  });
});
