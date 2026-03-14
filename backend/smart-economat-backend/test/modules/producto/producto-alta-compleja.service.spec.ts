import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Producto } from '../../../src/modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import {
  Alergeno,
  TipoProducto,
  UnidadMedida,
} from '../../../src/modules/producto/enums/producto.enums';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';

function createDeleteQueryBuilderMock() {
  return {
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ProductoService - Alta compleja', () => {
  let service: ProductoService;

  const mockProductoRepository = {
    existsByCodigoBarras: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductoProveedorRepository = {};
  const mockProductoAlergenoRepository = {};

  const mockMovimientoHelper = {
    trackProductoCreation: jest.fn(),
    trackProductoUpdate: jest.fn(),
    trackProductoDeletion: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        {
          provide: ProductoRepository,
          useValue: mockProductoRepository,
        },
        {
          provide: getRepositoryToken(ProductoProveedor),
          useValue: mockProductoProveedorRepository,
        },
        {
          provide: getRepositoryToken(ProductoAlergeno),
          useValue: mockProductoAlergenoRepository,
        },
        {
          provide: MovimientoHelper,
          useValue: mockMovimientoHelper,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('crea un producto maestro con alérgenos y proveedores en una sola transacción', async () => {
    const finalProduct = {
      id: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
      nombre: 'Leche',
      unidad: UnidadMedida.L,
      contenido: 1,
      tipo: TipoProducto.LACTEO,
      codigoBarras: '4006381333931',
      alergenos: [
        {
          productoId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
          alergeno: Alergeno.LACTEOS,
        },
      ],
      proveedores: [
        {
          id: '01954a86-0f77-7fd7-b357-d1d99a8b1482',
          proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
          precioUnitario: 1.45,
          marca: 'Pascual',
          proveedor: {
            id: '01954a87-0778-74d4-bb32-55b12044579f',
            nombre: 'Pascual',
          },
        },
      ],
    } as Producto;

    const deleteQueryBuilder = createDeleteQueryBuilderMock();
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        find: jest
          .fn()
          .mockResolvedValue([{ id: '01954a87-0778-74d4-bb32-55b12044579f' }]),
      }),
      create: jest.fn((_: unknown, payload: unknown) => payload),
      save: jest.fn((targetOrEntity: unknown, maybeEntity?: unknown) => {
        if (targetOrEntity === Producto && maybeEntity) {
          return Promise.resolve({
            id: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
            ...(maybeEntity as Record<string, unknown>),
          });
        }

        return Promise.resolve(maybeEntity ?? targetOrEntity);
      }),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(finalProduct),
      createQueryBuilder: jest.fn().mockReturnValue(deleteQueryBuilder),
    };

    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);
    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(callback(manager))
    );

    const result = await service.create(
      {
        nombre: 'Leche',
        tipo: TipoProducto.LACTEO,
        unidad: UnidadMedida.L,
        contenido: 1,
        codigoBarras: '4006381333931',
        alergenos: [Alergeno.LACTEOS],
        proveedores: [
          {
            proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
            precioUnitario: 1.45,
            marcaEspecifica: 'Pascual',
            codigoBarras: '5901234123457',
          },
        ],
      },
      'user-1'
    );

    expect(result).toEqual(finalProduct);
    expect(manager.createQueryBuilder).toHaveBeenCalled();
    expect(manager.find).toHaveBeenCalledWith(ProductoProveedor, {
      where: { producto: { id: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1' } },
      relations: ['proveedor'],
    });
    expect(mockMovimientoHelper.trackProductoCreation).toHaveBeenCalledWith(
      'user-1',
      '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
      'Creación de producto: Leche'
    );
  });

  it('rechaza alérgenos duplicados antes de abrir la transacción', async () => {
    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          alergenos: [Alergeno.LACTEOS, Alergeno.LACTEOS],
        },
        'user-1'
      )
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza proveedores duplicados en la misma solicitud', async () => {
    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);
    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(
        callback({
          getRepository: jest.fn(),
        })
      )
    );

    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          codigoBarras: '4006381333931',
          proveedores: [
            {
              proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
              precioUnitario: 1.45,
            },
            {
              proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
              precioUnitario: 1.5,
            },
          ],
        },
        'user-1'
      )
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza la alta compleja cuando el proveedor no existe', async () => {
    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);
    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(
        callback({
          getRepository: jest.fn().mockReturnValue({
            find: jest.fn().mockResolvedValue([]),
          }),
        })
      )
    );

    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          codigoBarras: '4006381333931',
          proveedores: [
            {
              proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
              precioUnitario: 1.45,
            },
          ],
        },
        'user-1'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza la alta compleja cuando falta el precio unitario del proveedor', async () => {
    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);
    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(
        callback({
          getRepository: jest.fn(),
        })
      )
    );

    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          codigoBarras: '4006381333931',
          proveedores: [
            {
              proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
            },
          ],
        },
        'user-1'
      )
    ).rejects.toThrow(/precio unitario/i);
  });

  it('actualiza el producto y reemplaza alérgenos y relaciones de proveedor en flujo conectado', async () => {
    const existingProduct = {
      id: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
      nombre: 'Leche',
      unidad: UnidadMedida.L,
      contenido: 1,
      codigoBarras: '4006381333931',
      proveedores: [],
      alergenos: [],
    } as Producto;

    const existingRelations = [
      {
        id: 'pp-1',
        proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
        proveedor: { id: '01954a87-0778-74d4-bb32-55b12044579f' },
        precioUnitario: 1.2,
        marca: 'Marca anterior',
        codigoBarras: '5901234123457',
      },
      {
        id: 'pp-2',
        proveedorId: '01954a87-0778-74d4-bb32-55b1204457af',
        proveedor: { id: '01954a87-0778-74d4-bb32-55b1204457af' },
        precioUnitario: 2,
        marca: 'Eliminar',
      },
    ];

    const updatedProduct = {
      ...existingProduct,
      nombre: 'Leche Premium',
      alergenos: [
        {
          productoId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
          alergeno: Alergeno.LACTEOS,
        },
        {
          productoId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
          alergeno: Alergeno.GLUTEN,
        },
      ],
      proveedores: [
        {
          id: 'pp-1',
          proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
          proveedor: { id: '01954a87-0778-74d4-bb32-55b12044579f' },
          precioUnitario: 1.5,
          marca: 'Pascual',
        },
        {
          id: 'pp-3',
          proveedorId: '01954a87-0778-74d4-bb32-55b1204457bf',
          proveedor: { id: '01954a87-0778-74d4-bb32-55b1204457bf' },
          precioUnitario: 1.8,
          marca: 'Asturiana',
        },
      ],
    } as Producto;

    const deleteQueryBuilder = createDeleteQueryBuilderMock();
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        find: jest
          .fn()
          .mockResolvedValue([
            { id: '01954a87-0778-74d4-bb32-55b12044579f' },
            { id: '01954a87-0778-74d4-bb32-55b1204457bf' },
          ]),
      }),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce(updatedProduct),
      count: jest.fn().mockResolvedValue(0),
      merge: jest.fn(
        (
          _: unknown,
          target: Record<string, unknown>,
          source: Record<string, unknown>
        ) => Object.assign(target, source)
      ),
      save: jest.fn((targetOrEntity: unknown, maybeEntity?: unknown) =>
        Promise.resolve(maybeEntity ?? targetOrEntity)
      ),
      create: jest.fn((_: unknown, payload: unknown) => payload),
      createQueryBuilder: jest.fn().mockReturnValue(deleteQueryBuilder),
      find: jest.fn().mockResolvedValue(existingRelations),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(callback(manager))
    );

    const result = await service.update(
      '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
      {
        nombre: 'Leche Premium',
        alergenos: [Alergeno.LACTEOS, Alergeno.GLUTEN],
        proveedores: [
          {
            proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
            precioUnitario: 1.5,
            marcaEspecifica: 'Pascual',
          },
          {
            proveedorId: '01954a87-0778-74d4-bb32-55b1204457bf',
            precioUnitario: 1.8,
            marcaEspecifica: 'Asturiana',
          },
        ],
      },
      'user-1'
    );

    expect(result).toEqual(updatedProduct);
    expect(manager.softDelete).toHaveBeenCalledWith(ProductoProveedor, 'pp-2');
    expect(mockMovimientoHelper.trackProductoUpdate).toHaveBeenCalledWith(
      'user-1',
      '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
      'Actualización de producto: Leche Premium'
    );
  });
});
