import { Test, TestingModule } from '@nestjs/testing';
import { ProduccionService } from '../../../src/modules/receta/service/produccion.service';
import { RecetaRepository } from '../../../src/modules/receta/repository/receta.repository';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstadoLote } from '../../../src/modules/receta/enums/receta.enums';
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
    };

    manager = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      getRepository: jest.fn(),
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
          { recetaId: 'invalid', cantidadProducida: 10 },
          mockUser
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('debe ejecutar producción correctamente y descontar stock', async () => {
      recetaRepository.findById.mockResolvedValue(mockReceta);
      recetaRepository.ensureProductoElaborado.mockResolvedValue({
        id: 'prod-res-1',
      });

      const mockProductoProveedor = {
        id: 'pp-res-1',
        producto: { id: 'prod-res-1', unidad: 'kg' },
      };

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
      manager.findOne
        .mockResolvedValueOnce(mockProductoProveedor)
        .mockResolvedValueOnce({
          id: 'lote-1',
          receta: mockReceta,
          usuario: { id: mockUser },
        });

      const mockUbicacion = { id: 'ub-1' };
      manager.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUbicacion),
        update: jest.fn().mockResolvedValue({}),
      });

      const result = await service.ejecutarProduccion(
        { recetaId: 'receta-1', cantidadProducida: 5 },
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
      };

      manager.findOne
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
        tipo: TipoConsumoProduccion.RACIONES,
        valor: 5,
      } satisfies ConsumirProduccionDto);

      expect(result.porcionesRestantes).toBe(0);
      expect(result.estado).toBe(EstadoLote.AGOTADO);
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
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta);

      await expect(
        service.consumirPorciones('lote-1', {
          tipo: TipoConsumoProduccion.RACIONES,
          valor: 5,
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
      };

      manager.findOne
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta)
        .mockResolvedValueOnce({
          ...mockLote,
          receta: mockReceta,
          porcionesRestantes: 7,
          estado: EstadoLote.DISPONIBLE,
        });
      manager.save.mockImplementation((_, entity) => entity);

      const result = await service.consumirPorciones('lote-1', {
        tipo: TipoConsumoProduccion.CANTIDAD,
        valor: 1.5,
      } satisfies ConsumirProduccionDto);

      expect(result.porcionesRestantes).toBe(7);
      expect(result.estado).toBe(EstadoLote.DISPONIBLE);
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
        .mockResolvedValueOnce(mockLote)
        .mockResolvedValueOnce(mockReceta);

      await expect(
        service.consumirPorciones('lote-1', {
          tipo: TipoConsumoProduccion.CANTIDAD,
          valor: 1.2,
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

      manager.findOne
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
        items: [{ recetaId: 'rec-1', cantidad: 1 }],
      });

      expect(result.ingredients[0].isEnough).toBe(true);
      expect(result.ingredients[0].requerido).toBe(10);
      expect(result.ingredients[0].disponible).toBe(100);
    });
  });
});
