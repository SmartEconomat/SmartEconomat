import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Producto } from '../../../src/modules/producto/producto.entity/producto.entity';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proveedor } from '../../../src/modules/proveedor/proveedor.entity/proveedor.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  UnidadMedida,
  Alergeno,
} from '../../../src/modules/producto/enums/producto.enums';
import { ArchivoService } from '../../../src/modules/archivo/service/archivo.service';

describe('ProductoService', () => {
  let service: ProductoService;

  const mockProductoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    existsByCodigoBarras: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProductoProveedorRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProductoAlergenoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMovimientoHelper = {
    createMovimiento: jest.fn(),
    trackProductoCreation: jest.fn(),
    trackProductoUpdate: jest.fn(),
    trackProductoDeletion: jest.fn(),
  };

  const mockArchivoService = {
    normalizeStoredPath: jest.fn((value) => value),
    removeFileByStoredPath: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn(),
  };

  const mockProveedorRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
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
          provide: getRepositoryToken(Proveedor),
          useValue: mockProveedorRepository,
        },
        {
          provide: ArchivoService,
          useValue: mockArchivoService,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject duplicated proveedores in create payload', async () => {
    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);

    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(
        callback({
          getRepository: jest.fn().mockReturnValue({ find: jest.fn() }),
        })
      )
    );

    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          alergenos: [Alergeno.LACTEOS],
          proveedores: [
            {
              proveedorId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
              precioUnitario: 1.3,
            },
            {
              proveedorId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
              precioUnitario: 1.4,
            },
          ],
        },
        'user-1'
      )
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject missing proveedor in create payload', async () => {
    mockProductoRepository.existsByCodigoBarras.mockResolvedValue(false);

    const manager = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      Promise.resolve(callback(manager))
    );

    await expect(
      service.create(
        {
          nombre: 'Leche',
          unidad: UnidadMedida.L,
          contenido: 1,
          proveedores: [
            {
              proveedorId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
              precioUnitario: 1.3,
            },
          ],
        },
        'user-1'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('debe calcular PMP ponderado con stock previo y nueva recepción', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue({
        id: 'pp-1',
        pmp: 4,
        producto: { id: 'prod-1' },
      }),
      find: jest
        .fn()
        .mockResolvedValue([{ cantidadActual: 10 }, { cantidadActual: 15 }]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const recalculateSpy = jest
      .spyOn(service as any, 'recalcularPmpProducto')
      .mockResolvedValue(undefined);

    const pmp = await service.actualizarPMP('pp-1', 5, 6, em as any);

    expect(pmp).toBe(4.4);
    expect(em.update).toHaveBeenCalledWith(
      ProductoProveedor,
      { id: 'pp-1' },
      { pmp: 4.4 }
    );
    expect(recalculateSpy).toHaveBeenCalledWith('prod-1', em);
  });

  it('debe conservar el último PMP del producto si el stock total es 0', async () => {
    const producto = {
      id: 'prod-1',
      pmp: 4.5,
      proveedores: [
        { id: 'pp-1', pmp: 3 },
        { id: 'pp-2', pmp: 7 },
      ],
    };

    const em = {
      findOne: jest.fn().mockResolvedValue(producto),
      find: jest.fn().mockResolvedValue([
        { productoProveedorId: 'pp-1', cantidadActual: 0 },
        { productoProveedorId: 'pp-2', cantidadActual: 0 },
      ]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    await (service as any).recalcularPmpProducto('prod-1', em);

    expect(em.update).toHaveBeenCalledWith(
      Producto,
      { id: 'prod-1' },
      { pmp: 4.5 }
    );
  });
});
