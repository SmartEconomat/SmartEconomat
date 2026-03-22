import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
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
});
