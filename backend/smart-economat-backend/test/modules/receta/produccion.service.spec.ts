import { Test, TestingModule } from '@nestjs/testing';
import { ProduccionService } from '../../../src/modules/receta/service/produccion.service';
import { RecetaRepository } from '../../../src/modules/receta/repository/receta.repository';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstadoLote } from '../../../src/modules/receta/enums/receta.enums';
import { Movimiento } from '../../../src/modules/movimiento/movimiento.entity/movimiento.entity';
import { ProduccionLote } from '../../../src/modules/receta/produccion-lote.entity/produccion-lote.entity';
import {
  ConsumirProduccionDto,
  TipoConsumoProduccion,
} from '../../../src/modules/receta/dto/consumir-produccion.dto';

describe('ProduccionService', () => {
  let service: ProduccionService;
  let recetaRepository: any;
  let dataSource: any;
  let manager: any;

  beforeEach(async () => {
    recetaRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      ensureProductoElaborado: jest.fn(),
      findPreferredProveedorForProductoElaborado: jest.fn(),
    };

    manager = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      getRepository: jest.fn().mockImplementation(() => ({
        findOne: jest.fn().mockResolvedValue(null),
      })),
    };

    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProduccionService,
        { provide: RecetaRepository, useValue: recetaRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ProduccionService>(ProduccionService);
  });

  describe('ejecutarProduccion', () => {
    const mockUser = 'user-123';
    const mockReceta = {
      id: 'receta-1',
      nombre: 'Tortilla',
      rendimiento: 10,
      ingredientes: [
        {
          producto: { id: 'ing-1', nombre: 'Huevo', unidad: 'ud' },
          cantidad: 2,
          unidad: 'ud',
        },
      ],
      raciones: 10,
    };

    it('debe lanzar NotFoundException si la receta no existe', async () => {
      recetaRepository.findById.mockResolvedValue(null);
      await expect(
        service.ejecutarProduccion(
          {
            recetaId: 'invalid',
            cantidadProducida: 10,
            idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e11',
          },
          mockUser
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('debe ejecutar producción correctamente y descontar stock', async () => {
      recetaRepository.findById.mockResolvedValue(mockReceta);
      recetaRepository.ensureProductoElaborado.mockResolvedValue({
        id: 'prod-res-1',
      });
      recetaRepository.findPreferredProveedorForProductoElaborado.mockResolvedValue(
        {
          id: 'pp-res-1',
          producto: { id: 'prod-res-1', unidad: 'kg' },
        }
      );

      const mockInventarioIng = {
        id: 'inv-1',
        cantidadActual: 100,
        productoProveedor: {
          id: 'pp-ing-1',
          producto: { id: 'ing-1', nombre: 'Huevo', unidad: 'ud' },
          precioUnitario: 0.5,
        },
        ajustarCantidad: jest.fn(),
        conversionFactor: jest.fn().mockReturnValue(1),
      };

      const qbIngredientes = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockInventarioIng]),
      };
      manager.createQueryBuilder.mockReturnValueOnce(qbIngredientes);

      manager.create.mockImplementation((entity, data) => data);
      manager.save.mockResolvedValue({ id: 'lote-1' });
      manager.findOne.mockResolvedValueOnce({
        id: 'lote-1',
        receta: mockReceta,
        usuario: { id: mockUser },
      });

      const mockUbicacion = { id: 'ub-1' };
      manager.getRepository.mockImplementation((entity: unknown) => {
        if (entity === Movimiento || entity === ProduccionLote) {
          return {
            findOne: jest.fn().mockResolvedValue(null),
          };
        }

        return {
          findOne: jest.fn().mockResolvedValue(mockUbicacion),
          update: jest.fn().mockResolvedValue({}),
        };
      });

      const result = await service.ejecutarProduccion(
        {
          recetaId: 'receta-1',
          cantidadProducida: 5,
          idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e12',
        },
        mockUser
      );

      expect(result).toBeDefined();
      expect(mockInventarioIng.ajustarCantidad).toHaveBeenCalledWith(-1);
      expect(manager.save).toHaveBeenCalled();
    });
  });

  describe('consumirPorciones', () => {
    it('debe reducir raciones y cambiar estado a AGOTADO si llega a 0', async () => {
      const mockReceta = {
        id: 'receta-1',
        raciones: 1,
        rendimiento: 1,
      };
      const mockLote = {
        id: 'lote-1',
        recetaId: 'receta-1',
        porcionesRestantes: 5,
        estado: EstadoLote.DISPONIBLE,
        fechaAgotado: null,
      };

      jest
        .spyOn(service as any, 'consumeInventarioProductoElaborado')
        .mockResolvedValue([
          {
            inv: { id: 'inv-res-1' },
            descontar: 5,
            pp: { id: 'pp-res-1' },
          },
        ]);

      manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta)
        .mockResolvedValueOnce({
          ...mockLote,
          receta: mockReceta,
          porcionesRestantes: 0,
          estado: EstadoLote.AGOTADO,
          fechaAgotado: new Date('2026-04-04T09:00:00.000Z'),
        });
      manager.save.mockImplementation((_, entity) => entity);

      const result = await service.consumirPorciones('lote-1', {
        tipo: TipoConsumoProduccion.RACIONES,
        valor: 5,
        idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e13',
      } satisfies ConsumirProduccionDto);

      expect(result.porcionesRestantes).toBe(0);
      expect(result.estado).toBe(EstadoLote.AGOTADO);
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: EstadoLote.AGOTADO,
          fechaAgotado: expect.any(Date),
        })
      );
      expect(manager.save).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si no hay suficientes raciones', async () => {
      const mockReceta = {
        id: 'receta-1',
        raciones: 1,
        rendimiento: 1,
      };
      const mockLote = {
        id: 'lote-1',
        recetaId: 'receta-1',
        porcionesRestantes: 2,
        estado: EstadoLote.DISPONIBLE,
      };

      manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta);

      await expect(
        service.consumirPorciones('lote-1', {
          tipo: TipoConsumoProduccion.RACIONES,
          valor: 5,
          idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e14',
        } satisfies ConsumirProduccionDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir consumo por cantidad cuando es multiplo exacto del tamano de racion', async () => {
      const mockReceta = {
        id: 'receta-1',
        tamanioRacion: 0.5,
        unidadResultado: 'kg',
      };
      const mockLote = {
        id: 'lote-1',
        recetaId: 'receta-1',
        porcionesRestantes: 10,
        estado: EstadoLote.DISPONIBLE,
        fechaAgotado: null,
      };

      jest
        .spyOn(service as any, 'consumeInventarioProductoElaborado')
        .mockResolvedValue([
          {
            inv: { id: 'inv-res-2' },
            descontar: 1.5,
            pp: { id: 'pp-res-2' },
          },
        ]);

      manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta)
        .mockResolvedValueOnce({
          ...mockLote,
          receta: mockReceta,
          porcionesRestantes: 7,
          estado: EstadoLote.DISPONIBLE,
          fechaAgotado: null,
        });
      manager.save.mockImplementation((_, entity) => entity);

      const result = await service.consumirPorciones('lote-1', {
        tipo: TipoConsumoProduccion.CANTIDAD,
        valor: 1.5,
        idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e15',
      } satisfies ConsumirProduccionDto);

      expect(result.porcionesRestantes).toBe(7);
      expect(result.estado).toBe(EstadoLote.DISPONIBLE);
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: EstadoLote.DISPONIBLE,
          fechaAgotado: null,
        })
      );
      expect(manager.save).toHaveBeenCalled();
    });

    it('debe rechazar consumo por cantidad cuando no es multiplo exacto del tamano de racion', async () => {
      const mockReceta = {
        id: 'receta-1',
        tamanioRacion: 0.5,
        unidadResultado: 'kg',
      };
      const mockLote = {
        id: 'lote-1',
        recetaId: 'receta-1',
        porcionesRestantes: 10,
        estado: EstadoLote.DISPONIBLE,
      };

      manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta);

      await expect(
        service.consumirPorciones('lote-1', {
          tipo: TipoConsumoProduccion.CANTIDAD,
          valor: 1.2,
          idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e16',
        } satisfies ConsumirProduccionDto)
      ).rejects.toThrow('La cantidad a consumir debe ser múltiplo de 0.25 kg.');
    });

    it('debe permitir consumir una cantidad equivalente a media racion acumulada', async () => {
      const mockReceta = {
        id: 'receta-1',
        tamanioRacion: 0.17,
        unidadResultado: 'kg',
      };
      const mockLote = {
        id: 'lote-1',
        recetaId: 'receta-1',
        porcionesRestantes: 8.5,
        estado: EstadoLote.DISPONIBLE,
      };

      jest
        .spyOn(service as any, 'consumeInventarioProductoElaborado')
        .mockResolvedValue([
          {
            inv: { id: 'inv-res-3' },
            descontar: 1.445,
            pp: { id: 'pp-res-3' },
          },
        ]);

      manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta)
        .mockResolvedValueOnce({
          ...mockLote,
          receta: mockReceta,
          porcionesRestantes: 0,
          estado: EstadoLote.AGOTADO,
        });
      manager.save.mockImplementation((_, entity) => entity);

      const result = await service.consumirPorciones('lote-1', {
        tipo: TipoConsumoProduccion.CANTIDAD,
        valor: 1.445,
        idempotencyKey: '019658f5-2b6a-7fd8-bb20-1f6a812f3e17',
      } satisfies ConsumirProduccionDto);

      expect(result.porcionesRestantes).toBe(0);
      expect(result.estado).toBe(EstadoLote.AGOTADO);
    });
  });

  describe('validarMultiple', () => {
    it('debe validar stock para múltiples recetas', async () => {
      const mockRecetas = [
        {
          id: 'rec-1',
          rendimiento: 1,
          ingredientes: [
            { producto: { id: 'p-1', nombre: 'A' }, cantidad: 10, unidad: 'g' },
          ],
        },
      ];
      recetaRepository.findByIds.mockResolvedValue(mockRecetas);

      const mockInventarios = [
        {
          cantidadActual: 100,
          productoProveedor: {
            producto: { id: 'p-1', nombre: 'A', unidad: 'g' },
          },
        },
      ];
      dataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue(mockInventarios),
      });

      const result = await service.validarMultiple({
        items: [{ recetaId: 'rec-1', cantidadAProducir: 1 }],
      });

      expect(result.ingredients[0].isEnough).toBe(true);
      expect(result.ingredients[0].requerido).toBe(10);
      expect(result.ingredients[0].disponible).toBe(100);
      expect(result.itemsResumen).toHaveLength(1);
      expect(result.itemsResumen[0].factorEscalado).toBe(1);
    });

    it('debe agregar el mismo producto convirtiendo unidades antes de comparar stock', async () => {
      recetaRepository.findByIds.mockResolvedValue([
        {
          id: 'rec-kg',
          rendimiento: 1,
          ingredientes: [
            {
              producto: { id: 'p-1', nombre: 'Harina' },
              cantidad: 1,
              unidad: 'kg',
            },
          ],
        },
        {
          id: 'rec-g',
          rendimiento: 1,
          ingredientes: [
            {
              producto: { id: 'p-1', nombre: 'Harina' },
              cantidad: 500,
              unidad: 'g',
            },
          ],
        },
      ]);

      dataSource.getRepository
        .mockReturnValueOnce({
          find: jest.fn().mockResolvedValue([
            {
              cantidadActual: 2,
              productoProveedor: {
                producto: { id: 'p-1', nombre: 'Harina', unidad: 'KG' },
              },
            },
          ]),
        })
        .mockReturnValueOnce({
          find: jest.fn().mockResolvedValue([]),
        });

      const result = await service.validarMultiple({
        items: [
          { recetaId: 'rec-kg', cantidadAProducir: 1 },
          { recetaId: 'rec-g', cantidadAProducir: 1 },
        ],
      });

      expect(result.ingredients[0].requerido).toBe(1.5);
      expect(result.ingredients[0].disponible).toBe(2);
      expect(result.ingredients[0].isEnough).toBe(true);
    });

    it('debe aplicar merma en la validación igual que al ejecutar producción', async () => {
      recetaRepository.findByIds.mockResolvedValue([
        {
          id: 'rec-1',
          rendimiento: 1,
          ingredientes: [
            {
              producto: { id: 'p-1', nombre: 'Tomate' },
              cantidad: 1,
              unidad: 'kg',
              mermaAplicada: 10,
            },
          ],
        },
      ]);

      dataSource.getRepository
        .mockReturnValueOnce({
          find: jest.fn().mockResolvedValue([
            {
              cantidadActual: 1.05,
              productoProveedor: {
                producto: { id: 'p-1', nombre: 'Tomate', unidad: 'KG' },
              },
            },
          ]),
        })
        .mockReturnValueOnce({
          find: jest.fn().mockResolvedValue([]),
        });

      const result = await service.validarMultiple({
        items: [{ recetaId: 'rec-1', cantidadAProducir: 1 }],
      });

      expect(result.ingredients[0].requerido).toBe(1.111);
      expect(result.ingredients[0].disponible).toBe(1.05);
      expect(result.ingredients[0].isEnough).toBe(false);
    });

    it('lanza error cuando intenta convertir unidades incompatibles', () => {
      expect(() => (service as any).conversionFactor('ud', 'kg')).toThrow(
        BadRequestException
      );
    });
  });

  describe('findAll', () => {
    it('combina filtros de estado y búsqueda sin sobrescribir condiciones', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      dataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      });

      await service.findAll({
        estado: String(EstadoLote.DISPONIBLE),
        searchTerm: 'tortilla',
        page: 1,
        limit: 10,
      } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'lote.deleted_at IS NULL'
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'lote.estado = :estado',
        {
          estado: EstadoLote.DISPONIBLE,
        }
      );
      expect(
        queryBuilder.andWhere.mock.calls.some(
          (call: unknown[]) =>
            call.length > 0 && typeof call[0] !== 'string' && call[0] != null
        )
      ).toBe(true);
    });
  });
});
