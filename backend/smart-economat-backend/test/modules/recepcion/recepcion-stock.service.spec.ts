/*
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
            it('procesarRecepcionMasiva asume isWeighedWithScale=false si no se informa', async () => {
              const pedido = createPedido('ped-omitido', EstadoPedido.PENDIENTE_DE_APROBACION, [
                { id: 'pp-omitido', cantidad: 2, nombre: 'Azúcar' },
              ]);

              mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
                if (entity === Usuario) {
                  return Promise.resolve({ id: 'user-omitido' });
                }
                if (entity === Pedido || (typeof entity === 'object' && entity !== null && entity.name === 'Pedido')) {
                  return Promise.resolve(pedido);
                }
                return Promise.resolve(null);
              });

              queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
                if (entity === Ubicacion) {
                  return Promise.resolve({ id: 'ubi-omitido', nombre: 'Almacén Principal' });
                }
                if (entity === Albaran) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              const result = await service.procesarRecepcionMasiva(
                {
                  pedidoId: 'ped-omitido',
                  nAlbaran: 'ALB-OMITIDO-001',
                  observaciones: 'Recepción sin isWeighedWithScale',
                  productosRecibidos: [
                    {
                      pedidoProductoId: 'pp-omitido',
                      cantidadRecibida: 2,
                      cantidadAlbaran: 2,
                      estadoVisual: EstadoVisualProducto.OPTIMO
                      
                    },
                  ],
                },
                'user-omitido'
              );

              const recepcionProductoSave = queryRunner.manager.save.mock.calls.find(
                ([arg]: [any]) => Array.isArray(arg) && arg[0]?.pedidoProducto?.id === 'pp-omitido'
              );
              expect(recepcionProductoSave).toBeDefined();
              const saved = recepcionProductoSave[0][0];
              expect(saved.isWeighedWithScale).toBe(false);
              expect(result.incidencias).toEqual([]);
              expect(result.inventariosCreados).toBe(1);
              expect(result.movimientosGenerados).toBe(1);
              expect(result.pedidosActualizados[0].estadoNuevo).toBe(EstadoPedido.RECEPCIONADO);
            });
          it('procesarRecepcionMasiva rechaza o marca incidencia si el peso es irrealmente alto', async () => {
            const pedido = createPedido('ped-alto', EstadoPedido.PENDIENTE_DE_APROBACION, [
              { id: 'pp-alto', cantidad: 1, nombre: 'Sal' },
            ]);

            mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
              if (entity === Usuario) {
                return Promise.resolve({ id: 'user-alto' });
              }
              if (entity === Pedido) {
                return Promise.resolve(pedido);
              }
              return Promise.resolve(null);
            });

            queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
              if (entity === Ubicacion) {
                return Promise.resolve({ id: 'ubi-alto', nombre: 'Almacén Principal' });
              }
              if (entity === Albaran) {
                return Promise.resolve(null);
              }
              return Promise.resolve(null);
            });

            
            await expect(
              service.procesarRecepcionMasiva(
                {
                  pedidoId: 'ped-alto',
                  nAlbaran: 'ALB-ALTO-001',
                  observaciones: 'Recepción peso irrealmente alto',
                  productosRecibidos: [
                    {
                      pedidoProductoId: 'pp-alto',
                      cantidadRecibida: 1_000_000,
                      cantidadAlbaran: 1_000_000,
                      estadoVisual: EstadoVisualProducto.OPTIMO,
                      isWeighedWithScale: true,
                    },
                  ],
                },
                'user-alto'
              )
            ).rejects.toBeInstanceOf(Error);
          });
        it('procesarRecepcionMasiva rechaza líneas con peso 0 o negativo', async () => {
          const pedido = createPedido('ped-cero', EstadoPedido.PENDIENTE_DE_APROBACION, [
            { id: 'pp-cero', cantidad: 2, nombre: 'Azúcar' },
          ]);

          mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
            if (entity === Usuario) {
              return Promise.resolve({ id: 'user-cero' });
            }
            if (entity === Pedido) {
              return Promise.resolve(pedido);
            }
            return Promise.resolve(null);
          });

          queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
            if (entity === Ubicacion) {
              return Promise.resolve({ id: 'ubi-cero', nombre: 'Almacén Principal' });
            }
            if (entity === Albaran) {
              return Promise.resolve(null);
            }
            return Promise.resolve(null);
          });

          
          await expect(
            service.procesarRecepcionMasiva(
              {
                pedidoId: 'ped-cero',
                nAlbaran: 'ALB-CERO-001',
                observaciones: 'Recepción peso cero',
                productosRecibidos: [
                  {
                    pedidoProductoId: 'pp-cero',
                    cantidadRecibida: 0,
                    cantidadAlbaran: 0,
                    estadoVisual: EstadoVisualProducto.OPTIMO,
                    isWeighedWithScale: true,
                  },
                ],
              },
              'user-cero'
            )
          ).rejects.toBeInstanceOf(Error);

          
          await expect(
            service.procesarRecepcionMasiva(
              {
                pedidoId: 'ped-cero',
                nAlbaran: 'ALB-CERO-002',
                observaciones: 'Recepción peso negativo',
                productosRecibidos: [
                  {
                    pedidoProductoId: 'pp-cero',
                    cantidadRecibida: -5,
                    cantidadAlbaran: -5,
                    estadoVisual: EstadoVisualProducto.OPTIMO,
                    isWeighedWithScale: false,
                  },
                ],
              },
              'user-cero'
            )
          ).rejects.toBeInstanceOf(Error);
        });
      it('procesarRecepcionMasiva soporta mezcla de líneas con y sin balanza', async () => {
        const pedido = createPedido('ped-mix', EstadoPedido.PENDIENTE_DE_APROBACION, [
          { id: 'pp-balanza', cantidad: 2, nombre: 'Harina' },
          { id: 'pp-manual', cantidad: 1, nombre: 'Café' },
        ]);

        mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
          if (entity === Usuario) {
            return Promise.resolve({ id: 'user-mix' });
          }
          if (entity === Pedido || (typeof entity === 'object' && entity !== null && entity.name === 'Pedido')) {
            return Promise.resolve(pedido);
          }
          return Promise.resolve(null);
        });

        queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
          if (entity === Ubicacion) {
            return Promise.resolve({ id: 'ubi-mix', nombre: 'Almacén Principal' });
          }
          if (entity === Albaran) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        });

        const result = await service.procesarRecepcionMasiva(
          {
            pedidoId: 'ped-mix',
            nAlbaran: 'ALB-MIX-001',
            observaciones: 'Recepción mixta',
            productosRecibidos: [
              {
                pedidoProductoId: 'pp-balanza',
                cantidadRecibida: 2,
                cantidadAlbaran: 2,
                estadoVisual: EstadoVisualProducto.OPTIMO,
                isWeighedWithScale: true,
              },
              {
                pedidoProductoId: 'pp-manual',
                cantidadRecibida: 1,
                cantidadAlbaran: 1,
                estadoVisual: EstadoVisualProducto.OPTIMO,
                isWeighedWithScale: false,
              },
            ],
          },
          'user-mix'
        );

        const balanzaSave = queryRunner.manager.save.mock.calls.find(
          ([arg]: [any]) => Array.isArray(arg) && arg[0]?.pedidoProducto?.id === 'pp-balanza'
        );
        const manualSave = queryRunner.manager.save.mock.calls.find(
          ([arg]: [any]) => Array.isArray(arg) && arg[0]?.pedidoProducto?.id === 'pp-manual'
        );
        expect(balanzaSave).toBeDefined();
        expect(manualSave).toBeDefined();
        expect(balanzaSave[0][0].isWeighedWithScale).toBe(true);
        expect(manualSave[0][0].isWeighedWithScale).toBe(false);
        expect(result.incidencias).toEqual([]);
        expect(result.inventariosCreados).toBe(2);
        expect(result.movimientosGenerados).toBe(2);
        expect(result.pedidosActualizados[0].estadoNuevo).toBe(EstadoPedido.RECEPCIONADO);
      });
    it('procesarRecepcionMasiva registra correctamente isWeighedWithScale=false (peso manual)', async () => {
      const pedido = createPedido('ped-manual', EstadoPedido.PENDIENTE_DE_APROBACION, [
        { id: 'pp-manual', cantidad: 2, nombre: 'Sal' },
      ]);

      mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Usuario) {
          return Promise.resolve({ id: 'user-manual' });
        }
        if (entity === Pedido || (typeof entity === 'object' && entity !== null && entity.name === 'Pedido')) {
          return Promise.resolve(pedido);
        }
        return Promise.resolve(null);
      });

      queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
        if (entity === Ubicacion) {
          return Promise.resolve({ id: 'ubi-manual', nombre: 'Almacén Principal' });
        }
        if (entity === Albaran) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      const result = await service.procesarRecepcionMasiva(
        {
          pedidoId: 'ped-manual',
          nAlbaran: 'ALB-MANUAL-001',
          observaciones: 'Recepción manual',
          productosRecibidos: [
            {
              pedidoProductoId: 'pp-manual',
              cantidadRecibida: 2,
              cantidadAlbaran: 2,
              estadoVisual: EstadoVisualProducto.OPTIMO,
              isWeighedWithScale: false,
            },
          ],
        },
        'user-manual'
      );

      const recepcionProductoSave = queryRunner.manager.save.mock.calls.find(
        ([arg]: [any]) => Array.isArray(arg) && arg[0]?.pedidoProducto?.id === 'pp-manual'
      );
      expect(recepcionProductoSave).toBeDefined();
      const saved = recepcionProductoSave[0][0];
      expect(saved.isWeighedWithScale).toBe(false);
      expect(result.incidencias).toEqual([]);
      expect(result.inventariosCreados).toBe(1);
      expect(result.movimientosGenerados).toBe(1);
      expect(result.pedidosActualizados[0].estadoNuevo).toBe(EstadoPedido.RECEPCIONADO);
    });
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
    estado: EstadoPedido = EstadoPedido.PENDIENTE_DE_APROBACION,
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
      .mockResolvedValueOnce({ id: 'ped-1', estado: EstadoPedido.RECEPCIONADO });

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-1', productosRecibidos: [] } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('procesarRecepcionMasiva procesa recepción exacta en batch sin incidencias', async () => {
    const pedido = createPedido('ped-1', EstadoPedido.PENDIENTE_DE_APROBACION, [
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
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

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
        estadoAnterior: EstadoPedido.PENDIENTE_DE_APROBACION,
        estadoNuevo: EstadoPedido.RECEPCIONADO,
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
    const pedido = createPedido('ped-2', EstadoPedido.PENDIENTE_DE_APROBACION, [
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
      .mockResolvedValue(EstadoPedido.POR_RECEPCIONAR);

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
      EstadoPedido.POR_RECEPCIONAR
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
    const pedido1 = createPedido('ped-10', EstadoPedido.PENDIENTE_DE_APROBACION, [
      { id: 'pp-10', cantidad: 4, nombre: 'Arroz' },
    ]);
    const pedido2 = createPedido('ped-20', EstadoPedido.POR_RECEPCIONAR, [
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
      .mockResolvedValueOnce(EstadoPedido.RECEPCIONADO)
      .mockResolvedValueOnce(EstadoPedido.RECEPCIONADO);

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
        estadoAnterior: EstadoPedido.PENDIENTE_DE_APROBACION,
        estadoNuevo: EstadoPedido.RECEPCIONADO,
      },
      {
        id: 'ped-20',
        estadoAnterior: EstadoPedido.POR_RECEPCIONAR,
        estadoNuevo: EstadoPedido.RECEPCIONADO,
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
    const pedido = createPedido('ped-30', EstadoPedido.PENDIENTE_DE_APROBACION, [
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

  it('actualizarEstadoPedido dispara RECEPCION_PARCIAL y devuelve PARCIAL', async () => {
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
      estado: EstadoPedido.POR_RECEPCIONAR,
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
    expect(result).toBe(EstadoPedido.POR_RECEPCIONAR);
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
      estado: EstadoPedido.POR_RECEPCIONAR,
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
    expect(result).toBe(EstadoPedido.POR_RECEPCIONAR);
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
      estado: EstadoPedido.RECEPCIONADO,
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
    expect(result).toBe(EstadoPedido.RECEPCIONADO);
  });
});

*/

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecepcionStockService } from '../../../src/modules/recepcion/service/recepcion-stock.service';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';
import { PedidoStatusTrigger } from '../../../src/modules/pedido/enums/pedido-status-trigger.enum';
import { EstadoVisualProducto } from '../../../src/modules/recepcion/enums/estado-visual.enum';
import { Albaran } from '../../../src/modules/albaran/albaran.entity/albaran.entity';
import { Pedido } from '../../../src/modules/pedido/pedido.entity/pedido.entity';
import { Ubicacion } from '../../../src/modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';

const createPedido = (
  id: string,
  estado: EstadoPedido = EstadoPedido.POR_RECEPCIONAR,
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
    productoProveedorId: `pprov-${linea.id}`,
    precioUnitario: 2.5,
  })),
});

const assignIds = <T>(value: T): T => {
  if (Array.isArray(value)) {
    value.forEach((item) => assignIds(item));
    return value;
  }

  if (value && typeof value === 'object' && !('id' in value)) {
    (value as Record<string, unknown>).id =
      `generated-${Math.random().toString(36).slice(2, 10)}`;
  }

  return value;
};

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

  const mockProductoService = {
    actualizarPMP: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();

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
          return Promise.resolve(assignIds(entity));
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
    mockDataSource.manager.findOne.mockReset();
    mockDataSource.manager.find.mockReset();
    mockPedidoService.handleStatusTransition.mockReset();
    mockEventEmitter.emit.mockReset();
    mockProductoService.actualizarPMP.mockReset();

    service = new RecepcionStockService(
      mockDataSource as any,
      mockPedidoService as any,
      mockEventEmitter as any,
      mockProductoService as any
    );
  });

  const mockUserAndPedido = (userId: string, pedido: unknown) => {
    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      const name =
        typeof entity === 'function' ? entity.name : (entity as any)?.name;
      if (entity === Usuario || name === 'Usuario') {
        return Promise.resolve({ id: userId });
      }
      if (entity === Pedido || name === 'Pedido') {
        return Promise.resolve(pedido);
      }
      return Promise.resolve(null);
    });
  };

  const mockRecepcionContext = (opts?: {
    albaran?: unknown;
    ubicacion?: unknown;
  }) => {
    queryRunner.manager.findOne.mockImplementation((entity: unknown) => {
      const name =
        typeof entity === 'function' ? entity.name : (entity as any)?.name;
      if (entity === Ubicacion || name === 'Ubicacion') {
        return Promise.resolve(
          opts?.ubicacion ?? { id: 'ubi-1', nombre: 'Almacén Principal' }
        );
      }
      if (entity === Albaran || name === 'Albaran') {
        return Promise.resolve(opts?.albaran ?? null);
      }
      return Promise.resolve(null);
    });
  };

  const findRecepcionProducto = (pedidoProductoId: string) => {
    const call = queryRunner.manager.save.mock.calls.find(([arg]: [any]) => {
      if (!Array.isArray(arg)) return false;
      return arg.some((item) => item?.pedidoProducto?.id === pedidoProductoId);
    });
    const batch = call?.[0] as
      | Array<{ pedidoProducto?: { id: string }; isWeighedWithScale?: boolean }>
      | undefined;
    return batch?.find((item) => item?.pedidoProducto?.id === pedidoProductoId);
  };

  it('rechaza usuario inexistente', async () => {
    mockDataSource.manager.findOne.mockResolvedValueOnce(null);

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-1', productosRecibidos: [] } as any,
        'user-x'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza pedidos no recepcionables', async () => {
    mockDataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.RECEPCIONADO,
      });

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-1', productosRecibidos: [] } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza pedidos en estado parcial o incidencia para recepcion masiva', async () => {
    mockDataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({
        id: 'ped-parcial',
        estado: EstadoPedido.PARCIAL,
      });

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-parcial', productosRecibidos: [] } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    mockDataSource.manager.findOne
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({
        id: 'ped-incidencia',
        estado: EstadoPedido.INCIDENCIA,
      });

    await expect(
      service.procesarRecepcionMasiva(
        { pedidoId: 'ped-incidencia', productosRecibidos: [] } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza pedidos en estado parcial o incidencia para recepcion normal', async () => {
    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      const name =
        typeof entity === 'function' ? entity.name : (entity as any)?.name;
      if (entity === Usuario || name === 'Usuario') {
        return Promise.resolve({ id: 'user-estado' });
      }
      return Promise.resolve(null);
    });

    mockDataSource.manager.find.mockResolvedValueOnce([
      createPedido('ped-parcial', EstadoPedido.PARCIAL, [
        { id: 'pp-parcial', cantidad: 1, nombre: 'Harina' },
      ]),
    ]);

    await expect(
      service.procesarRecepcion({
        usuarioId: 'user-estado',
        pedidos: [{ pedidoId: 'ped-parcial' }],
        productos: [
          {
            pedidoProductoId: 'pp-parcial',
            cantidadRecibida: 1,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);

    mockDataSource.manager.find.mockResolvedValueOnce([
      createPedido('ped-incidencia', EstadoPedido.INCIDENCIA, [
        { id: 'pp-incidencia', cantidad: 1, nombre: 'Azucar' },
      ]),
    ]);

    await expect(
      service.procesarRecepcion({
        usuarioId: 'user-estado',
        pedidos: [{ pedidoId: 'ped-incidencia' }],
        productos: [
          {
            pedidoProductoId: 'pp-incidencia',
            cantidadRecibida: 1,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra isWeighedWithScale=true desde balanza', async () => {
    const pedido = createPedido('ped-balanza', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-balanza', cantidad: 3, nombre: 'Azúcar' },
    ]);
    mockUserAndPedido('user-balanza', pedido);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-balanza',
        nAlbaran: 'ALB-BALANZA-001',
        observaciones: 'Recepción con balanza',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-balanza',
            cantidadRecibida: 3,
            cantidadAlbaran: 3,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            isWeighedWithScale: true,
          },
        ],
      },
      'user-balanza'
    );

    const batch = findRecepcionProducto('pp-balanza');
    expect(batch).toBeDefined();
    expect(batch?.isWeighedWithScale).toBe(true);
    expect(result.incidencias).toEqual([]);
    expect(result.inventariosCreados).toBe(1);
    expect(result.movimientosGenerados).toBe(1);
    expect(result.pedidosActualizados[0].estadoNuevo).toBe(
      EstadoPedido.RECEPCIONADO
    );
  });

  it('invoca actualizarPMP con productoProveedorId, cantidad y precio de la línea', async () => {
    const pedido = createPedido('ped-pmp', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-pmp', cantidad: 3, nombre: 'Arroz' },
    ]);
    (
      pedido.pedidoProductos[0] as {
        precioUnitario: number;
      }
    ).precioUnitario = 3.75;

    mockUserAndPedido('user-pmp', pedido);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

    await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-pmp',
        nAlbaran: 'ALB-PMP-001',
        observaciones: 'Recepción para validación de PMP',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-pmp',
            cantidadRecibida: 3,
            cantidadAlbaran: 3,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
      },
      'user-pmp'
    );

    expect(mockProductoService.actualizarPMP).toHaveBeenCalledWith(
      'pprov-pp-pmp',
      3,
      3.75,
      queryRunner.manager
    );
  });

  it('registra isWeighedWithScale=false en peso manual', async () => {
    const pedido = createPedido('ped-manual', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-manual', cantidad: 2, nombre: 'Sal' },
    ]);
    mockUserAndPedido('user-manual', pedido);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-manual',
        nAlbaran: 'ALB-MANUAL-001',
        observaciones: 'Recepción manual',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-manual',
            cantidadRecibida: 2,
            cantidadAlbaran: 2,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            isWeighedWithScale: false,
          },
        ],
      },
      'user-manual'
    );

    const batch = findRecepcionProducto('pp-manual');
    expect(batch).toBeDefined();
    expect(batch?.isWeighedWithScale).toBe(false);
    expect(result.incidencias).toEqual([]);
    expect(result.inventariosCreados).toBe(1);
    expect(result.movimientosGenerados).toBe(1);
  });

  it('procesarRecepcion genera incidencias por faltante y no entregado', async () => {
    const pedido = createPedido('ped-faltas', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-falta', cantidad: 5, nombre: 'Leche' },
      { id: 'pp-no-entregado', cantidad: 3, nombre: 'Tomate' },
    ]);

    mockDataSource.manager.findOne.mockImplementation((entity: unknown) => {
      const name =
        typeof entity === 'function' ? entity.name : (entity as any)?.name;
      if (entity === Usuario || name === 'Usuario') {
        return Promise.resolve({ id: 'user-faltas' });
      }
      return Promise.resolve(null);
    });
    mockDataSource.manager.find.mockResolvedValue([pedido]);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.POR_RECEPCIONAR);

    const result = await service.procesarRecepcion({
      usuarioId: 'user-faltas',
      pedidos: [{ pedidoId: 'ped-faltas', nAlbaran: 'ALB-FALTAS-001' }],
      observaciones: 'Recepción parcial con faltas',
      productos: [
        {
          pedidoProductoId: 'pp-falta',
          cantidadRecibida: 2,
          cantidadAlbaran: 2,
          estadoVisual: EstadoVisualProducto.OPTIMO,
        },
      ],
    } as any);

    expect(result.incidencias).toHaveLength(1);
    expect(result.incidencias[0].datosOriginales.productos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idPedidoProducto: 'pp-falta',
          tipo: 'FALTA',
          diferencia: -3,
          cantidadRecibida: 2,
        }),
        expect.objectContaining({
          idPedidoProducto: 'pp-no-entregado',
          tipo: 'NO_ENTREGADO',
          diferencia: -3,
          cantidadRecibida: 0,
        }),
      ])
    );
    expect(result.movimientosGenerados).toBe(1);
    expect(result.inventariosCreados).toBe(1);
    expect(result.pedidosActualizados).toEqual([
      {
        id: 'ped-faltas',
        estadoAnterior: EstadoPedido.POR_RECEPCIONAR,
        estadoNuevo: EstadoPedido.POR_RECEPCIONAR,
      },
    ]);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('asume isWeighedWithScale=false si no se informa', async () => {
    const pedido = createPedido('ped-omitido', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-omitido', cantidad: 2, nombre: 'Azúcar' },
    ]);
    mockUserAndPedido('user-omitido', pedido);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-omitido',
        nAlbaran: 'ALB-OMITIDO-001',
        observaciones: 'Recepción sin flag',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-omitido',
            cantidadRecibida: 2,
            cantidadAlbaran: 2,
            estadoVisual: EstadoVisualProducto.OPTIMO,
          },
        ],
      },
      'user-omitido'
    );

    const batch = findRecepcionProducto('pp-omitido');
    expect(batch).toBeDefined();
    expect(batch?.isWeighedWithScale).toBe(false);
    expect(result.incidencias).toEqual([]);
    expect(result.inventariosCreados).toBe(1);
    expect(result.movimientosGenerados).toBe(1);
  });

  it('soporta mezcla de líneas con y sin balanza', async () => {
    const pedido = createPedido('ped-mix', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-balanza', cantidad: 2, nombre: 'Harina' },
      { id: 'pp-manual', cantidad: 1, nombre: 'Café' },
    ]);
    mockUserAndPedido('user-mix', pedido);
    mockRecepcionContext();
    jest
      .spyOn(service as any, 'actualizarEstadoPedido')
      .mockResolvedValue(EstadoPedido.RECEPCIONADO);

    const result = await service.procesarRecepcionMasiva(
      {
        pedidoId: 'ped-mix',
        nAlbaran: 'ALB-MIX-001',
        observaciones: 'Recepción mixta',
        productosRecibidos: [
          {
            pedidoProductoId: 'pp-balanza',
            cantidadRecibida: 2,
            cantidadAlbaran: 2,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            isWeighedWithScale: true,
          },
          {
            pedidoProductoId: 'pp-manual',
            cantidadRecibida: 1,
            cantidadAlbaran: 1,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            isWeighedWithScale: false,
          },
        ],
      },
      'user-mix'
    );

    const balanza = findRecepcionProducto('pp-balanza');
    const manual = findRecepcionProducto('pp-manual');
    expect(balanza?.isWeighedWithScale).toBe(true);
    expect(manual?.isWeighedWithScale).toBe(false);
    expect(result.inventariosCreados).toBe(2);
    expect(result.movimientosGenerados).toBe(2);
  });

  it('rechaza peso 0 o negativo', async () => {
    const pedido = createPedido('ped-cero', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-cero', cantidad: 2, nombre: 'Azúcar' },
    ]);
    mockUserAndPedido('user-cero', pedido);
    mockRecepcionContext();

    await expect(
      service.procesarRecepcionMasiva(
        {
          pedidoId: 'ped-cero',
          nAlbaran: 'ALB-CERO-001',
          productosRecibidos: [
            {
              pedidoProductoId: 'pp-cero',
              cantidadRecibida: 0,
              cantidadAlbaran: 0,
              estadoVisual: EstadoVisualProducto.OPTIMO,
              isWeighedWithScale: true,
            },
          ],
        },
        'user-cero'
      )
    ).rejects.toThrow(/positivo|RECEPTION_FAILED|fallo en la recepci[oó]n/i);

    await expect(
      service.procesarRecepcionMasiva(
        {
          pedidoId: 'ped-cero',
          nAlbaran: 'ALB-CERO-002',
          productosRecibidos: [
            {
              pedidoProductoId: 'pp-cero',
              cantidadRecibida: -5,
              cantidadAlbaran: -5,
              estadoVisual: EstadoVisualProducto.OPTIMO,
              isWeighedWithScale: false,
            },
          ],
        },
        'user-cero'
      )
    ).rejects.toThrow(/positivo|RECEPTION_FAILED|fallo en la recepci[oó]n/i);
  });

  it('rechaza cantidades irrealmente altas', async () => {
    const pedido = createPedido('ped-alto', EstadoPedido.POR_RECEPCIONAR, [
      { id: 'pp-alto', cantidad: 1, nombre: 'Sal' },
    ]);
    mockUserAndPedido('user-alto', pedido);
    mockRecepcionContext();

    await expect(
      service.procesarRecepcionMasiva(
        {
          pedidoId: 'ped-alto',
          nAlbaran: 'ALB-ALTO-001',
          productosRecibidos: [
            {
              pedidoProductoId: 'pp-alto',
              cantidadRecibida: 1_000_000,
              cantidadAlbaran: 1_000_000,
              estadoVisual: EstadoVisualProducto.OPTIMO,
              isWeighedWithScale: true,
            },
          ],
        },
        'user-alto'
      )
    ).rejects.toThrow(/irrealmente alta|RECEPTION_FAILED/i);
  });

  it('actualizarEstadoPedido dispara RECEPCION_PARCIAL cuando falta cantidad', async () => {
    queryRunner.manager.findOne.mockResolvedValue({
      id: 'ped-2',
      pedidoProductos: [{ id: 'pp-1', cantidad: 10 }],
    });
    queryRunner.manager.find.mockResolvedValue([
      {
        recepcion: {
          recepcionProductos: [
            {
              pedidoProducto: { id: 'pp-1' },
              cantidadRecibida: 4,
              estadoProducto: 'PERFECTO',
            },
          ],
        },
      },
    ]);
    mockPedidoService.handleStatusTransition.mockResolvedValue({
      id: 'ped-2',
      estado: EstadoPedido.POR_RECEPCIONAR,
    });

    const result = await (service as any).actualizarEstadoPedido(
      'ped-2',
      queryRunner.manager
    );

    expect(mockPedidoService.handleStatusTransition).toHaveBeenCalledWith(
      'ped-2',
      PedidoStatusTrigger.RECEPCION_PARCIAL,
      queryRunner.manager,
      undefined
    );
    expect(result).toBe(EstadoPedido.POR_RECEPCIONAR);
  });

  it('actualizarEstadoPedido dispara RECEPCION_TOTAL cuando coincide todo', async () => {
    queryRunner.manager.findOne.mockResolvedValue({
      id: 'ped-4',
      pedidoProductos: [{ id: 'pp-3', cantidad: 5 }],
    });
    queryRunner.manager.find.mockResolvedValue([
      {
        recepcion: {
          recepcionProductos: [
            {
              pedidoProducto: { id: 'pp-3' },
              cantidadRecibida: 5,
              estadoProducto: 'PERFECTO',
            },
          ],
        },
      },
    ]);
    mockPedidoService.handleStatusTransition.mockResolvedValue({
      id: 'ped-4',
      estado: EstadoPedido.RECEPCIONADO,
    });

    const result = await (service as any).actualizarEstadoPedido(
      'ped-4',
      queryRunner.manager
    );

    expect(mockPedidoService.handleStatusTransition).toHaveBeenCalledWith(
      'ped-4',
      PedidoStatusTrigger.RECEPCION_TOTAL,
      queryRunner.manager,
      undefined
    );
    expect(result).toBe(EstadoPedido.RECEPCIONADO);
  });
});
