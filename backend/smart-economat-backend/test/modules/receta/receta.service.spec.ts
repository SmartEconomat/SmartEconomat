import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecetaService } from '../../../src/modules/receta/service/receta.service';
import { TipoMovimiento } from '../../../src/modules/movimiento/enums/movimiento.enums';

describe('RecetaService', () => {
  const mockRecetaRepo = {
    create: jest.fn(),
    findAllPaginated: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    duplicate: jest.fn(),
  };
  const mockDataSource = {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  };

  let service: RecetaService;

  const mockCostQueryBuilders = (
    products: Array<Record<string, unknown>>,
    providerPrices: Array<Record<string, unknown>> = []
  ) => {
    const productoQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(products),
    };

    const providerQb = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(providerPrices),
    };

    mockDataSource.getRepository.mockImplementation((entity: unknown) => {
      const entityName =
        typeof entity === 'function' && 'name' in entity
          ? String(entity.name)
          : '';

      if (entityName === 'ProductoProveedor') {
        return {
          createQueryBuilder: jest.fn().mockReturnValue(providerQb),
        };
      }

      return {
        createQueryBuilder: jest.fn().mockReturnValue(productoQb),
      };
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecetaService(mockRecetaRepo as any, mockDataSource as any);
  });

  it('calcularEscandallo calcula el coste total usando PMP cuando no hay precio por proveedor', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-1',
      nombre: 'Tortilla',
      rendimiento: 1,
      ingredientes: [
        {
          producto: { id: 'prod-1', nombre: 'Huevo' },
          cantidad: 2,
          unidad: 'ud',
          mermaAplicada: 0,
        },
      ],
    });
    mockCostQueryBuilders([
      {
        id: 'prod-1',
        nombre: 'Huevo',
        pmp: 2,
        proveedores: [],
      },
    ]);

    const result = await service.calcularEscandallo('rec-1');

    expect(result).toMatchObject({
      recetaId: 'rec-1',
      recetaNombre: 'Tortilla',
      costoTotal: 4,
      costoUnitarioEstimado: 4,
      desglosePorIngrediente: [
        {
          productoId: 'prod-1',
          productoNombre: 'Huevo',
          cantidad: 2,
          cantidadReal: 2,
          unidad: 'ud',
          precioUnitario: 2,
          costoIngrediente: 4,
        },
      ],
    });
  });

  it('calcularEscandallo prioriza el precio del proveedor favorito cuando existe', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-1b',
      nombre: 'Prueba proveedor favorito',
      rendimiento: 1,
      ingredientes: [
        {
          producto: { id: 'prod-1b', nombre: 'Patata' },
          cantidad: 2,
          unidad: 'kg',
          mermaAplicada: 0,
          proveedorFavoritoId: 'prov-favorito',
        },
      ],
    });

    mockCostQueryBuilders(
      [
        {
          id: 'prod-1b',
          nombre: 'Patata',
          pmp: 4,
          mermaPorcentaje: 0,
        },
      ],
      [
        {
          productoId: 'prod-1b',
          proveedorId: 'prov-favorito',
          precioUnitario: 0.5,
        },
        {
          productoId: 'prod-1b',
          proveedorId: 'prov-caro',
          precioUnitario: 9,
        },
      ]
    );

    const result = await service.calcularEscandallo('rec-1b');

    expect(result.costoTotal).toBe(1);
    expect(result.desglosePorIngrediente[0].precioUnitario).toBe(0.5);
  });

  it('calcularEscandallo usa proveedor mas barato si no hay proveedor favorito valido', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-1bb',
      nombre: 'Prueba proveedor mas barato',
      rendimiento: 1,
      ingredientes: [
        {
          producto: { id: 'prod-1bb', nombre: 'Tomate' },
          cantidad: 3,
          unidad: 'kg',
          mermaAplicada: 0,
          proveedorFavoritoId: 'prov-inexistente',
        },
      ],
    });

    mockCostQueryBuilders(
      [
        {
          id: 'prod-1bb',
          nombre: 'Tomate',
          pmp: 7,
          mermaPorcentaje: 0,
        },
      ],
      [
        {
          productoId: 'prod-1bb',
          proveedorId: 'prov-1',
          precioUnitario: 1.2,
        },
        {
          productoId: 'prod-1bb',
          proveedorId: 'prov-2',
          precioUnitario: 0.9,
        },
      ]
    );

    const result = await service.calcularEscandallo('rec-1bb');

    expect(result.costoTotal).toBeCloseTo(2.7, 6);
    expect(result.desglosePorIngrediente[0].precioUnitario).toBe(0.9);
  });

  it('calcularEscandallo aplica merma base del producto cuando no hay merma de ingrediente', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-1c',
      nombre: 'Prueba merma producto',
      rendimiento: 1,
      ingredientes: [
        {
          producto: { id: 'prod-1c', nombre: 'Zanahoria' },
          cantidad: 10,
          unidad: 'kg',
        },
      ],
    });

    mockCostQueryBuilders([
      {
        id: 'prod-1c',
        nombre: 'Zanahoria',
        pmp: 5,
        mermaPorcentaje: 20,
      },
    ]);

    const result = await service.calcularEscandallo('rec-1c');

    expect(result.desglosePorIngrediente[0].cantidadReal).toBeCloseTo(12.5, 4);
    expect(result.costoTotal).toBeCloseTo(62.5, 4);
  });

  it('getDetalle agrega stock y alérgenos consolidados', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-2',
      ingredientes: [
        {
          cantidad: 3,
          unidad: 'kg',
          producto: {
            id: 'prod-2',
            nombre: 'Harina',
            alergenos: [{ alergeno: 'GLUTEN' }],
          },
        },
      ],
    });
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ productoId: 'prod-2', totalStock: '1' }]),
    };
    mockDataSource.getRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    });

    const result = await service.getDetalle('rec-2');

    expect(result.detalleIngredientes[0]).toMatchObject({
      stockActual: 1,
      cantidadFaltante: 2,
    });
    expect(result.alergenosConsolidados).toEqual(['GLUTEN']);
  });

  it('cocinar rechaza cuando no hay stock suficiente', async () => {
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-3',
      nombre: 'Sopa',
      ingredientes: [
        { producto: { id: 'prod-3', nombre: 'Caldo' }, cantidad: 5 },
      ],
    });
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          cantidadActual: 2,
          productoProveedor: { producto: { id: 'prod-3' } },
        },
      ]),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.cocinar('rec-3', { cantidad: 1 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cocinar consume inventario FIFO por caducidad y crea movimientos', async () => {
    const inv1 = {
      id: 'inv-1',
      cantidadActual: 2,
      ajustarCantidad: jest.fn(function (this: any, delta: number) {
        this.cantidadActual += delta;
      }),
      productoProveedor: { id: 'pp-1', producto: { id: 'prod-4' } },
    };
    const inv2 = {
      id: 'inv-2',
      cantidadActual: 5,
      ajustarCantidad: jest.fn(function (this: any, delta: number) {
        this.cantidadActual += delta;
      }),
      productoProveedor: { id: 'pp-2', producto: { id: 'prod-4' } },
    };
    mockRecetaRepo.findById.mockResolvedValue({
      id: 'rec-4',
      nombre: 'Crema',
      ingredientes: [
        { producto: { id: 'prod-4', nombre: 'Leche' }, cantidad: 4 },
      ],
    });
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([inv1, inv2]),
    };
    const createdMovements: any[] = [];
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn().mockImplementation((_: unknown, payload: any) => {
        createdMovements.push(payload);
        return payload;
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await service.cocinar('rec-4', { cantidad: 1 } as any);

    expect(inv1.ajustarCantidad).toHaveBeenCalledWith(-2);
    expect(inv2.ajustarCantidad).toHaveBeenCalledWith(-2);
    expect(createdMovements[0]).toMatchObject({
      tipo: TipoMovimiento.SALIDA_ELABORACION,
    });
  });

  it('duplicate delega en el repositorio', async () => {
    mockRecetaRepo.duplicate.mockResolvedValue({ id: 'rec-5' });

    await expect(
      service.duplicate({ sourceId: 'rec-4', newName: 'Crema Copy' } as any)
    ).resolves.toEqual({ id: 'rec-5' });
  });

  it('recalcularCostes actualiza costeUnitarioEstimado', async () => {
    mockRecetaRepo.findById
      .mockResolvedValueOnce({ id: 'rec-6', rendimiento: 2 })
      .mockResolvedValueOnce({ id: 'rec-6', costeUnitarioEstimado: 6 });
    jest
      .spyOn(service, 'calcularEscandallo')
      .mockResolvedValue({ costoTotal: 12 } as any);
    const update = jest.fn().mockResolvedValue(undefined);
    mockDataSource.getRepository.mockReturnValue({ update });

    const result = await service.recalcularCostes('rec-6');

    expect(update).toHaveBeenCalledWith('rec-6', { costeUnitarioEstimado: 6 });
    expect(result).toEqual({ id: 'rec-6', costeUnitarioEstimado: 6 });
  });

  it('findOne lanza NotFoundException si no existe la receta', async () => {
    mockRecetaRepo.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-rec')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
