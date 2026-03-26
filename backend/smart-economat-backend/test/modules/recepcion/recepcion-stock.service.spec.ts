import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecepcionStockService } from '../../../src/modules/recepcion/service/recepcion-stock.service';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';
import { EstadoVisualProducto } from '../../../src/modules/recepcion/enums/estado-visual.enum';
import { Albaran } from '../../../src/modules/albaran/albaran.entity/albaran.entity';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoStatusTrigger } from '../../../src/modules/pedido/enums/pedido-status-trigger.enum';
import { Ubicacion } from '../../../src/modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';

describe('RecepcionStockService', () => {
  const mockDataSource = {
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
    },
    createQueryRunner: jest.fn(),
  };

  const mockPedidoService = {
    handleStatusTransition: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  let service: RecepcionStockService;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    isTransactionActive: boolean;
    manager: {
      findOne: jest.Mock;
      find: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
      getRepository: jest.Mock;
    };
  };
  let idCounter: number;

  const createPedido = (
    id: string,
    estado: EstadoPedido = EstadoPedido.PENDIENTE,
    lineas: Array<{ id: string; cantidad: number; nombre: string }>
  ) => ({
    id,
    estado,
    proveedor: { id: `prov-${id}` },
    pedidoProductos: lineas.map((linea) => ({
      id: linea.id,
      cantidad: linea.cantidad,
      productoProveedor: {
        id: `pprov-${linea.id}`,
        producto: { nombre: linea.nombre },
      },
    })),
  });

  const assignIdsInPlace = <T>(value: T): T => {
    if (Array.isArray(value)) {
      value.forEach((item) => assignIdsInPlace(item));
      return value;
    }

    if (value && typeof value === 'object' && !('id' in value)) {
      (value as Record<string, unknown>).id = `generated-${++idCounter}`;
    }

    return value;
  };

  const mockProductoService = {
    actualizarPMP: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPedidoService.handleStatusTransition.mockReset();
    mockEventEmitter.emit.mockReset();
    if (mockProductoService.actualizarPMP.mockReset) {
      mockProductoService.actualizarPMP.mockReset();
    }
    idCounter = 0;

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      isTransactionActive: true,
      manager: {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn((_entity: unknown, data: Record<string, unknown>) => ({
          ...data,
        })),
        save: jest.fn().mockImplementation((...args: unknown[]) => {
          const entity = args.length === 1 ? args[0] : args[1];
          return Promise.resolve(assignIdsInPlace(entity));
        }),
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          }),
        }),
      },
    };

    mockDataSource.createQueryRunner.mockReturnValue(queryRunner);
    service = new RecepcionStockService(
      mockDataSource as any,
      mockPedidoService as any,
      mockEventEmitter as any,
      mockProductoService as any
    );
  });

  it('procesarRecepcionMasiva rechaza usuario inexistente', async () => {
    mockDataSource.manager.findOne.mockResolvedValueOnce(null);

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-1', productosRecibidos: [] } as any,
        'user-x'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('procesarRecepcionMasiva rechaza pedidos no recepcionables', async () => {
    mockDataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({ id: 'ped-1', estado: EstadoPedido.RECIBIDO });

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-1', productosRecibidos: [] } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('procesarRecepcionMasiva procesa recepción exacta en batch sin incidencias', async () => {
    const pedido = createPedido('ped-1', EstadoPedido.PENDIENTE, [
      { id: 'pp-1', cantidad: 5, nombre: 'Leche' },
    ]);

    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Usuario) {
        return Promise.resolve({ id: 'user-1' });
      }
      if (entity === Pedido) {
        return Promise.resolve(pedido);
      }
      return Promise.resolve(null);
    });

    queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Ubicacion) {
        return Promise.resolve({ id: 'ubi-1', nombre: 'Almacén Principal' });
      }
      if (entity === Albaran) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECIBIDO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-1',
        nAlbaran: 'ALB-UNIT-001',
        observaciones: 'Recepción masiva exacta',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-1',
            cantidadRecibida: 5,
            cantidadAlbaran: 5,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
      },
      'user-1'
    );

    expect(result.incidencias).toEqual([]);
    expect(result.inventariosCreados).toBe(1);
    expect(result.movimientosGenerados).toBe(1);
    expect(result.pedidosActualizados).toEqual([
      {
        id: 'ped-1',
        estadoAnterior: EstadoPedido.PENDIENTE,
        estadoNuevo: EstadoPedido.RECIBIDO,
      },
    ]);

    const hasRecepcionProductosBatch = queryRunner.manager.save.mock.calls.some(
      ([arg]: [any]) => {
        if (!Array.isArray(arg) || arg.length !== 1) {
          return false;
        }

        const first = arg[0] as { pedidoProducto?: { id: string } };
        return first.pedidoProducto?.id === 'pp-1';
      }
    );

    expect(hasRecepcionProductosBatch).toBe(true);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'recepcion.completada',
      expect.objectContaining({
        recepcionId: result.id,
        nAlbaran: 'ALB-UNIT-001',
      })
    );
  });

  it('procesarRecepcionMasiva genera incidencias por falta y defectuoso', async () => {
    const pedido = createPedido('ped-2', EstadoPedido.PENDIENTE, [
      { id: 'pp-2', cantidad: 5, nombre: 'Tomate' },
    ]);

    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Usuario) {
        return Promise.resolve({ id: 'user-1' });
      }
      if (entity === Pedido) {
        return Promise.resolve(pedido);
      }
      return Promise.resolve(null);
    });

    queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Ubicacion) {
        return Promise.resolve({ id: 'ubi-1', nombre: 'Almacén Principal' });
      }
      return Promise.resolve(null);
    });

    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.EN_PROCESO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-2',
        observaciones: 'Recepción con mermas',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-2',
            cantidadRecibida: 2,
            estadoVisual: EstadoVisualProducto.ROTO,
            observaciones: 'Caja rota',
          },
        ],
      },
      'user-1'
    );

    expect(result.incidencias).toHaveLength(1);
    expect(result.incidencias[0].datosOriginales.productos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tipo: 'FALTA', diferencia: -3 }),
        expect.objectContaining({ tipo: 'DEFECTUOSO', diferencia: -2 }),
      ])
    );
    expect(result.pedidosActualizados[0].estadoNuevo).toBe(
      EstadoPedido.EN_PROCESO
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'recepcion.completada',
      expect.objectContaining({
        recepcionId: result.id,
        pedidoIds: ['ped-2'],
      })
    );
  });

  it('procesarRecepcion soporta multipedido y alta directa en una sola transacción', async () => {
    const pedido1 = createPedido('ped-10', EstadoPedido.PENDIENTE, [
      { id: 'pp-10', cantidad: 4, nombre: 'Arroz' },
    ]);
    const pedido2 = createPedido('ped-20', EstadoPedido.EN_PROCESO, [
      { id: 'pp-20', cantidad: 2, nombre: 'Aceite' },
    ]);

    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Usuario) {
        return Promise.resolve({ id: 'user-1' });
      }
      return Promise.resolve(null);
    });
    mockDataSource.manager.find.mockResolvedValue([pedido1, pedido2]);

    queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Ubicacion) {
        return Promise.resolve({ id: 'ubi-1', nombre: 'Almacén Principal' });
      }
      if (entity === Albaran) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    const actualizarEstadoPedidoSpy = jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValueOnce(EstadoPedido.RECIBIDO)
      .mockResolvedValueOnce(EstadoPedido.RECIBIDO);

    const result = await service.procesarRecepcion({
      usuarioId: 'user-1',
      pedidos: [
        {
          pedidoId: 'ped-10',
          nAlbaran: 'ALB-MULTI-1',
          observaciones: 'Pedido A',
        },
        {
          pedidoId: 'ped-20',
          nAlbaran: 'ALB-MULTI-2',
          observaciones: 'Pedido B',
        },
      ],
      observaciones: 'Recepción multipedido',
      productos: [
        {
          pedidoProductoId: 'pp-10',
          cantidadRecibida: 4,
          cantidadAlbaran: 4,
          estadoVisual: EstadoVisualProducto.OPTIMO,
        },
        {
          pedidoProductoId: 'pp-20',
          cantidadRecibida: 2,
          cantidadAlbaran: 2,
          estadoVisual: EstadoVisualProducto.OPTIMO,
        },
      ],
      productosNuevos: [
        {
          pendienteCreacion: true,
          codigoBarras: '8400000000001',
          nombre: 'Producto nuevo unitario',
          marca: 'Marca test',
          unidad: 'UNIDAD' as any,
          tipo: 'otro' as any,
          contenido: 1,
          cantidadRecibida: 3,
        },
      ],
    } as any);

    expect(result.incidencias).toEqual([]);
    expect(result.productosCreados).toHaveLength(1);
    expect(result.productosCreados[0]).toEqual(
      expect.objectContaining({
        nombre: 'Producto nuevo unitario',
        codigoBarras: '8400000000001',
      })
    );
    expect(result.inventariosCreados).toBe(3);
    expect(result.movimientosGenerados).toBe(3);
    expect(result.pedidosActualizados).toEqual([
      {
        id: 'ped-10',
        estadoAnterior: EstadoPedido.PENDIENTE,
        estadoNuevo: EstadoPedido.RECIBIDO,
      },
      {
        id: 'ped-20',
        estadoAnterior: EstadoPedido.EN_PROCESO,
        estadoNuevo: EstadoPedido.RECIBIDO,
      },
    ]);
    expect(actualizarEstadoPedidoSpy).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'recepcion.completada',
      expect.objectContaining({
        recepcionId: result.id,
        nAlbaran: 'ALB-MULTI-1',
      })
    );

    const saveCalls = queryRunner.manager.save.mock.calls;
    const albaranLinkSaves = saveCalls.filter(([arg]: [any]) => {
      const item = Array.isArray(arg) ? arg[0] : arg;
      return item && item.albaran && item.recepcionPedido;
    });

    expect(albaranLinkSaves.length).toBeGreaterThanOrEqual(1);

    const albaranSaves = saveCalls.filter(([arg]: [any]) => {
      const item = Array.isArray(arg) ? arg[0] : arg;
      return item && item.nAlbaran && (item.fecha || item.createdAt);
    });
    expect(albaranSaves.length).toBeGreaterThanOrEqual(1);
  });

  it('procesarRecepcion hace rollback si una línea no pertenece a los pedidos seleccionados', async () => {
    const pedido = createPedido('ped-30', EstadoPedido.PENDIENTE, [
      { id: 'pp-30', cantidad: 1, nombre: 'Yogur' },
    ]);

    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Usuario) {
        return Promise.resolve({ id: 'user-1' });
      }
      return Promise.resolve(null);
    });
    mockDataSource.manager.find.mockResolvedValue([pedido]);

    queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Ubicacion) {
        return Promise.resolve({ id: 'ubi-1', nombre: 'Almacén Principal' });
      }
      return Promise.resolve(null);
    });

    await expect(
      service.procesarRecepcion({
        usuarioId: 'user-1',
        pedidos: [{ pedidoId: 'ped-30' }],
        productos: [
          {
            pedidoProductoId: 'pp-ajeno',
            cantidadRecibida: 1,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
        productosNuevos: [
          {
            pendienteCreacion: true,
            codigoBarras: '8400000000002',
            nombre: 'No debe persistirse',
            unidad: 'UNIDAD' as any,
            tipo: 'otro' as any,
            contenido: 1,
            cantidadRecibida: 2,
          },
        ],
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('actualizarEstadoPedido dispara RECEPCION_PARCIAL y devuelve EN_PROCESO', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'ped-2',
        pedidoProductos: [{ id: 'pp-1', cantidad: 10 }],
      }),
      find: jest.fn().mockResolvedValue([
        {
          recepcion: {
            recepcionProductos: [
              { pedidoProducto: { id: 'pp-1' }, cantidadRecibida: 4 },
            ],
          },
        },
      ]),
      save: jest
        .fn()
        .mockImplementation(
          (_: unknown, pedidoGuardado: Record<string, unknown>) =>
            Promise.resolve(pedidoGuardado)
        ),
    };

    mockPedidoService.handleStatusTransition.mockResolvedValue({
      id: 'ped-2',
      estado: EstadoPedido.EN_PROCESO,
    });

    const result = await (service as any).actualizarEstadoPedido(
      'ped-2',
      manager
    );

    expect(mockPedidoService.handleStatusTransition).toHaveBeenCalledWith(
      'ped-2',
      PedidoStatusTrigger.RECEPCION_PARCIAL,
      manager
    );
    expect(result).toBe(EstadoPedido.EN_PROCESO);
  });

  it('actualizarEstadoPedido mantiene RECEPCION_PARCIAL cuando hay exceso o no entregado', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'ped-3',
        pedidoProductos: [{ id: 'pp-2', cantidad: 5 }],
      }),
      find: jest.fn().mockResolvedValue([
        {
          recepcion: {
            recepcionProductos: [
              { pedidoProducto: { id: 'pp-2' }, cantidadRecibida: 7 },
            ],
          },
        },
      ]),
      save: jest
        .fn()
        .mockImplementation(
          (_: unknown, pedidoGuardado: Record<string, unknown>) =>
            Promise.resolve(pedidoGuardado)
        ),
    };

    mockPedidoService.handleStatusTransition.mockResolvedValue({
      id: 'ped-3',
      estado: EstadoPedido.EN_PROCESO,
    });

    const result = await (service as any).actualizarEstadoPedido(
      'ped-3',
      manager
    );

    expect(mockPedidoService.handleStatusTransition).toHaveBeenCalledWith(
      'ped-3',
      PedidoStatusTrigger.RECEPCION_PARCIAL,
      manager
    );
    expect(result).toBe(EstadoPedido.EN_PROCESO);
  });

  it('actualizarEstadoPedido dispara RECEPCION_TOTAL cuando todas las cantidades coinciden', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'ped-4',
        pedidoProductos: [{ id: 'pp-3', cantidad: 5 }],
      }),
      find: jest.fn().mockResolvedValue([
        {
          recepcion: {
            recepcionProductos: [
              { pedidoProducto: { id: 'pp-3' }, cantidadRecibida: 5 },
            ],
          },
        },
      ]),
      save: jest
        .fn()
        .mockImplementation(
          (_: unknown, pedidoGuardado: Record<string, unknown>) =>
            Promise.resolve(pedidoGuardado)
        ),
    };

    mockPedidoService.handleStatusTransition.mockResolvedValue({
      id: 'ped-4',
      estado: EstadoPedido.RECIBIDO,
    });

    const result = await (service as any).actualizarEstadoPedido(
      'ped-4',
      manager
    );

    expect(mockPedidoService.handleStatusTransition).toHaveBeenCalledWith(
      'ped-4',
      PedidoStatusTrigger.RECEPCION_TOTAL,
      manager
    );
    expect(result).toBe(EstadoPedido.RECIBIDO);
  });
});
