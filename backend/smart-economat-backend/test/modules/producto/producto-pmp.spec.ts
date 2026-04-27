import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Proveedor } from '../../../src/modules/proveedor/proveedor.entity/proveedor.entity';
import { ArchivoService } from '../../../src/modules/archivo/service/archivo.service';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';

describe('ProductoService (PMP Fallback)', () => {
  let service: ProductoService;

  const mockProductoRepository = {};
  const mockProductoProveedorRepository = {};
  const mockProductoAlergenoRepository = {};
  const mockProveedorRepository = {};
  const mockArchivoService = {};
  const mockMovimientoHelper = {};
  const mockDataSource = {
    manager: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: ProductoRepository, useValue: mockProductoRepository },
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
        { provide: ArchivoService, useValue: mockArchivoService },
        { provide: MovimientoHelper, useValue: mockMovimientoHelper },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('debe usar el precioUnitario como semilla si el PMP anterior es 0', async () => {
    const mockPP = {
      id: 'pp-1',
      pmp: 0,
      precioUnitario: 10,
      producto: { id: 'prod-1' },
    };

    const em = {
      findOne: jest.fn().mockResolvedValue(mockPP),
      find: jest.fn().mockResolvedValue([{ cantidadActual: 100 }]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    jest
      .spyOn(service as any, 'recalcularPmpProducto')
      .mockResolvedValue(undefined);

    em.find.mockResolvedValue([{ cantidadActual: 101 }]);

    const pmp = await service.actualizarPMP('pp-1', 1, 20, em as any);

    expect(pmp).toBeCloseTo(10.099, 3);
    expect(em.update).toHaveBeenCalledWith(
      ProductoProveedor,
      { id: 'pp-1' },
      { pmp: 10.099 }
    );
  });

  it('debe usar el PMP existente si es mayor que 0', async () => {
    const mockPP = {
      id: 'pp-1',
      pmp: 5,
      precioUnitario: 10,
      producto: { id: 'prod-1' },
    };

    const em = {
      findOne: jest.fn().mockResolvedValue(mockPP),
      find: jest.fn().mockResolvedValue([{ cantidadActual: 20 }]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    jest
      .spyOn(service as any, 'recalcularPmpProducto')
      .mockResolvedValue(undefined);

    const pmp = await service.actualizarPMP('pp-1', 10, 15, em as any);

    expect(pmp).toBe(10);
  });
});
