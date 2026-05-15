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
import type { ProductFilterDto } from '../../../src/modules/producto/dto/product-filter.dto';
import type { ProductPriceHistoryQueryDto } from '../../../src/modules/producto/dto/product-price-history-query.dto';

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
    getHistorialPrecios: jest.fn(),
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

  it('debe delegar findAll en el servicio con el query recibido', async () => {
    const query: ProductFilterDto = { page: 1, limit: 10, nombre: 'leche' };
    const payload = {
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    mockProductoService.findAll.mockResolvedValue(payload);

    const result = await controller.findAll(query);

    expect(mockProductoService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(payload);
  });

  it('debe delegar findOne en el servicio con el id recibido', async () => {
    const producto = { id: 'prod-1', nombre: 'Leche Entera' };
    mockProductoService.findOne.mockResolvedValue(producto);

    const result = await controller.findOne('prod-1');

    expect(mockProductoService.findOne).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(producto);
  });

  it('debe delegar historial de precios con proveedorId validado por DTO', async () => {
    const historial = [{ id: 'hist-1' }];
    const query: ProductPriceHistoryQueryDto = {
      proveedorId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
    };

    mockProductoService.getHistorialPrecios.mockResolvedValue(historial);

    const result = await controller.getHistorialPrecios('prod-1', query);

    expect(mockProductoService.getHistorialPrecios).toHaveBeenCalledWith(
      'prod-1',
      query.proveedorId
    );
    expect(result).toEqual(historial);
  });
});
