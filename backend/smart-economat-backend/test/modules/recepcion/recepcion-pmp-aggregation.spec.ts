import { Test, TestingModule } from '@nestjs/testing';
import { RecepcionStockService } from '../../../src/modules/recepcion/service/recepcion-stock.service';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PedidoService } from '../../../src/modules/pedido/service/pedido.service';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';
import { EstadoVisualProducto } from '../../../src/modules/recepcion/enums/estado-visual.enum';

describe('RecepcionStockService (PMP Aggregation)', () => {
  let service: RecepcionStockService;
  let mockProductoService: any;
  let queryRunner: any;

  beforeEach(async () => {
    mockProductoService = {
      actualizarPMP: jest.fn().mockResolvedValue(10),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn((_, data) => data),
        save: jest.fn((data) =>
          Promise.resolve({ id: 'generated-id', ...data })
        ),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      manager: {
        findOne: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecepcionStockService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: PedidoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: ProductoService, useValue: mockProductoService },
        {
          provide: MovimientoHelper,
          useValue: {
            trackAction: jest.fn(),
            trackInventarioMovimiento: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecepcionStockService>(RecepcionStockService);

    const mockPedido = {
      id: 'ped-1',
      estado: EstadoPedido.POR_RECEPCIONAR,
      proveedor: { id: 'prov-1', nombre: 'Prov 1' },
      pedidoProductos: [
        {
          id: 'pp-1',
          cantidad: 10,
          precioUnitario: 5,
          productoProveedorId: 'pprov-1',
          productoProveedor: {
            id: 'pprov-1',
            productoProveedorId: 'pprov-1',
            precioUnitario: 5,
            producto: { nombre: 'Prod 1' },
          },
        },
        {
          id: 'pp-2',
          cantidad: 10,
          precioUnitario: 10,
          productoProveedorId: 'pprov-1',
          productoProveedor: {
            id: 'pprov-1',
            productoProveedorId: 'pprov-1',
            precioUnitario: 10,
            producto: { nombre: 'Prod 1' },
          },
        },
      ],
    };

    mockDataSource.manager.findOne.mockImplementation((entity: any) => {
      if (entity === Usuario) return Promise.resolve({ id: 'user-1' });
      if (entity === Pedido) return Promise.resolve(mockPedido);
      return Promise.resolve(null);
    });

    queryRunner.manager.findOne.mockResolvedValue({
      ...mockPedido,
      estado: EstadoPedido.POR_RECEPCIONAR,
    });
  });

  it('debe agrupar múltiples líneas del mismo producto en una sola llamada a actualizarPMP', async () => {
    const dto = {
      pedidoId: 'ped-1',
      nAlbaran: 'ALB-AGG-001',
      productosRecibidos: [
        {
          pedidoProductoId: 'pp-1',
          cantidadRecibida: 10,
          estadoVisual: EstadoVisualProducto.OPTIMO,
        },
        {
          pedidoProductoId: 'pp-2',
          cantidadRecibida: 10,
          estadoVisual: EstadoVisualProducto.OPTIMO,
        },
      ],
    };

    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);
    jest
      .spyOn(service as any, 'crearIncidenciaConLineas' as any)
      .mockResolvedValue({ id: 'inci-1' });

    await service.procesarRecepcionMasiva(dto as any, 'user-1');

    expect(mockProductoService.actualizarPMP).toHaveBeenCalledTimes(1);
    expect(mockProductoService.actualizarPMP).toHaveBeenCalledWith(
      'pprov-1',
      20,
      7.5,
      queryRunner.manager
    );
  });
});
