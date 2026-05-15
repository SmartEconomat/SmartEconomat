import { NotFoundException } from '@nestjs/common';
import { RecetaService } from '../../../src/modules/receta/service/receta.service';

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

  const mockProduccionService = {
    ejecutarProduccion: jest.fn(),
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
    service = new RecetaService(
      mockRecetaRepo as any,
      mockDataSource as any,
      mockProduccionService as any
    );
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

  it('cocinar delega en ProduccionService con la cantidad indicada', async () => {
    mockProduccionService.ejecutarProduccion.mockResolvedValue({
      id: 'lote-1',
    });

    await service.cocinar('rec-4', { cantidad: 3 } as any, 'user-1');

    expect(mockProduccionService.ejecutarProduccion).toHaveBeenCalledWith(
      expect.objectContaining({
        recetaId: 'rec-4',
        cantidadAProducir: 3,
        idempotencyKey: expect.any(String),
      }),
      'user-1'
    );
  });

  it('cocinar usa cantidad por defecto cuando no se indica', async () => {
    mockProduccionService.ejecutarProduccion.mockResolvedValue({
      id: 'lote-2',
    });

    await service.cocinar('rec-5', {} as any, 'user-2');

    expect(mockProduccionService.ejecutarProduccion).toHaveBeenCalledWith(
      expect.objectContaining({
        recetaId: 'rec-5',
        cantidadAProducir: 1,
        idempotencyKey: expect.any(String),
      }),
      'user-2'
    );
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
