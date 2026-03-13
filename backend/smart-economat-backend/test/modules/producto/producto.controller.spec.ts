import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from '../../../src/modules/producto/controller/producto.controller';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { AuthPermissionsService } from '../../../src/modules/auth/service/auth-permissions.service';
import { PermisosGuard } from '../../../src/modules/auth/guards/auth-permissions.guard';

describe('ProductoController', () => {
  let controller: ProductoController;

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
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn(),
  };

  const mockProductoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addProveedor: jest.fn(),
    removeProveedor: jest.fn(),
    addAdditionalPermission: jest.fn(),
    removeAdditionalPermission: jest.fn(),
    addExcludedPermission: jest.fn(),
    removeExcludedPermission: jest.fn(),
  };

  const mockAuthPermissionsService = {
    checkPermission: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [
        {
          provide: ProductoService,
          useValue: mockProductoService,
        },
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
        {
          provide: AuthPermissionsService,
          useValue: mockAuthPermissionsService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PermisosGuard,
          useValue: { canActivate: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
