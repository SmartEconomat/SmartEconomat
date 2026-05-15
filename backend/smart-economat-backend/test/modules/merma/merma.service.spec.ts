import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMermaDto } from '../../../src/modules/merma/dto/create-merma.dto';
import { CreateMermaProduccionDto } from '../../../src/modules/merma/dto/create-merma-produccion.dto';
import { MermaQueryDto } from '../../../src/modules/merma/dto/merma-query.dto';
import {
  MotivoMerma,
  TipoMerma,
} from '../../../src/modules/merma/enums/merma.enums';
import { MermaService } from '../../../src/modules/merma/service/merma.service';
import { EstadoLote } from '../../../src/modules/receta/enums/receta.enums';

describe('MermaService', () => {
  const mermaRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  const productoRepository = {
    findOne: jest.fn(),
  };

  const produccionLoteRepository = {
    findOne: jest.fn(),
  };

  const recetaIngredienteRepository = {
    findOne: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  let service: MermaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MermaService(
      mermaRepository as never,
      productoRepository as never,
      produccionLoteRepository as never,
      recetaIngredienteRepository as never,
      dataSource as unknown as DataSource
    );
  });

  it('debe retornar el mismo evento cuando llega la misma idempotencyKey', async () => {
    const existingMerma = {
      id: 'merma-idempotente',
      productoId: 'producto-1',
      cantidad: 2,
      motivo: MotivoMerma.ROTURA,
      tipo: TipoMerma.ROTURA,
      usuarioId: 'user-1',
      notas: null,
      origenEntidad: null,
      origenId: null,
      referenciaId: null,
    };

    mermaRepository.findOne.mockResolvedValue(existingMerma);

    const dto: CreateMermaDto = {
      productoId: 'producto-1',
      cantidad: 2,
      motivo: MotivoMerma.ROTURA,
      idempotencyKey: '01961496-cc99-7d4d-89f8-e7ac15e809f0',
    };

    const result = await service.create(dto, 'user-1');

    expect(result).toBe(existingMerma);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(productoRepository.findOne).not.toHaveBeenCalled();
  });

  it('debe fallar con conflicto si la misma idempotencyKey llega con payload distinto', async () => {
    mermaRepository.findOne.mockResolvedValue({
      id: 'merma-idempotente',
      productoId: 'producto-1',
      cantidad: 3,
      motivo: MotivoMerma.ROTURA,
      tipo: TipoMerma.ROTURA,
      usuarioId: 'user-1',
      notas: null,
      origenEntidad: null,
      origenId: null,
      referenciaId: null,
    });

    const dto: CreateMermaDto = {
      productoId: 'producto-1',
      cantidad: 2,
      motivo: MotivoMerma.ROTURA,
      idempotencyKey: '01961496-cc99-7d4d-89f8-e7ac15e809f0',
    };

    await expect(service.create(dto, 'user-1')).rejects.toThrow(
      ConflictException
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('debe fallar si el lote de producción no existe', async () => {
    produccionLoteRepository.findOne.mockResolvedValue(null);

    const dto: CreateMermaProduccionDto = {
      produccionLoteId: '01961496-cc99-7d4d-89f8-e7ac15e809f1',
      productoId: '01961496-cc99-7d4d-89f8-e7ac15e809f2',
      cantidad: 1,
      motivo: MotivoMerma.ERROR_PREPARACION,
    };

    await expect(service.createFromProduccion(dto, 'user-2')).rejects.toThrow(
      NotFoundException
    );
  });

  it('debe fallar si el lote está cancelado', async () => {
    produccionLoteRepository.findOne.mockResolvedValue({
      id: 'lote-1',
      recetaId: 'receta-1',
      estado: EstadoLote.CANCELADO,
    });

    const dto: CreateMermaProduccionDto = {
      produccionLoteId: '01961496-cc99-7d4d-89f8-e7ac15e809f1',
      productoId: '01961496-cc99-7d4d-89f8-e7ac15e809f2',
      cantidad: 1,
      motivo: MotivoMerma.ERROR_PREPARACION,
    };

    await expect(service.createFromProduccion(dto, 'user-2')).rejects.toThrow(
      BadRequestException
    );
    expect(recetaIngredienteRepository.findOne).not.toHaveBeenCalled();
  });

  it('debe fallar si el producto no pertenece a la receta del lote', async () => {
    produccionLoteRepository.findOne.mockResolvedValue({
      id: 'lote-1',
      recetaId: 'receta-1',
      estado: EstadoLote.DISPONIBLE,
    });
    recetaIngredienteRepository.findOne.mockResolvedValue(null);

    const dto: CreateMermaProduccionDto = {
      produccionLoteId: '01961496-cc99-7d4d-89f8-e7ac15e809f3',
      productoId: '01961496-cc99-7d4d-89f8-e7ac15e809f4',
      cantidad: 1.5,
      motivo: MotivoMerma.ERROR_PREPARACION,
    };

    await expect(service.createFromProduccion(dto, 'user-3')).rejects.toThrow(
      BadRequestException
    );
  });

  it('findAll aplica filtros y orden sobre QueryBuilder', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'm1' }], 1]),
    };
    mermaRepository.createQueryBuilder.mockReturnValue(qb);

    const query: MermaQueryDto = {
      page: 1,
      limit: 20,
      sortBy: 'cantidad',
      order: 'ASC',
      motivo: MotivoMerma.HURTO,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const result = await service.findAll(query);

    expect(mermaRepository.createQueryBuilder).toHaveBeenCalledWith('m');
    expect(qb.where).toHaveBeenCalledWith('m.deleted_at IS NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('m.motivo = :motivo', {
      motivo: MotivoMerma.HURTO,
    });
    expect(qb.orderBy).toHaveBeenCalledWith('m.cantidad', 'ASC');
    expect(result.total).toBe(1);
    expect(result.data).toEqual([{ id: 'm1' }]);
  });

  it('debe rechazar combinaciones incoherentes de tipo y motivo', async () => {
    const dto: CreateMermaDto = {
      productoId: 'producto-1',
      cantidad: 1,
      motivo: MotivoMerma.HURTO,
      tipo: TipoMerma.ROTURA,
    };

    await expect(service.create(dto, 'user-5')).rejects.toThrow(
      BadRequestException
    );
    expect(productoRepository.findOne).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('getStats devuelve números y limita por producto a 20 filas', async () => {
    const qbTemplate = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    let call = 0;
    mermaRepository.createQueryBuilder.mockImplementation(() => {
      call += 1;
      const qb = { ...qbTemplate };
      if (call === 1) {
        qb.getRawMany = jest.fn().mockResolvedValue([
          {
            motivo: MotivoMerma.ROTURA,
            totalRegistros: '3',
            totalCantidad: '12.5',
          },
        ]);
      } else {
        qb.getRawMany = jest.fn().mockResolvedValue([
          {
            productoId: 'p1',
            productoNombre: 'Aceite',
            totalRegistros: '2',
            totalCantidad: '4',
          },
        ]);
      }
      return qb;
    });

    const stats = await service.getStats({});

    expect(stats.porMotivo[0]).toEqual({
      motivo: MotivoMerma.ROTURA,
      totalRegistros: 3,
      totalCantidad: 12.5,
    });
    expect(stats.porProducto[0]).toEqual({
      productoId: 'p1',
      productoNombre: 'Aceite',
      totalRegistros: 2,
      totalCantidad: 4,
    });
    expect(qbTemplate.limit).toHaveBeenCalledWith(20);
  });

  it('getStats aplica filtro por motivo cuando se recibe en query', async () => {
    const qbs: Array<{ andWhere: jest.Mock }> = [];

    mermaRepository.createQueryBuilder.mockImplementation(() => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      qbs.push(qb);
      return qb;
    });

    await service.getStats({ motivo: MotivoMerma.ROTURA });

    expect(qbs).toHaveLength(2);
    expect(qbs[0].andWhere).toHaveBeenCalledWith('m.motivo = :motivo', {
      motivo: MotivoMerma.ROTURA,
    });
    expect(qbs[1].andWhere).toHaveBeenCalledWith('m.motivo = :motivo', {
      motivo: MotivoMerma.ROTURA,
    });
  });

  it('consumeInventoryByProduct respeta filtros contextuales por inventario y ubicación', async () => {
    const inventoryItem = {
      id: 'inv-1',
      cantidadActual: 10,
      productoProveedorId: 'pp-1',
      ajustarCantidad: jest.fn(),
    };

    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([inventoryItem]),
    };

    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const consumeFn = (
      service as unknown as {
        consumeInventoryByProduct: (
          tx: typeof manager,
          productoId: string,
          cantidad: number,
          productoNombre: string,
          context?: { inventarioId?: string; ubicacionId?: string }
        ) => Promise<Array<{ inventario: unknown; descontar: number }>>;
      }
    ).consumeInventoryByProduct.bind(service);

    await consumeFn(manager, 'producto-1', 2, 'Aceite', {
      inventarioId: 'inv-1',
      ubicacionId: 'ub-1',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('inv.id = :inventarioId', {
      inventarioId: 'inv-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inv.ubicacion_id = :ubicacionId',
      {
        ubicacionId: 'ub-1',
      }
    );
    expect(inventoryItem.ajustarCantidad).toHaveBeenCalledWith(-2);
  });

  it('resolveTipoMerma mapea hurto a tipo hurto', () => {
    const fn = (
      service as unknown as { resolveTipoMerma: (m: MotivoMerma) => TipoMerma }
    ).resolveTipoMerma.bind(service);
    expect(fn(MotivoMerma.HURTO)).toBe(TipoMerma.HURTO);
  });
});
