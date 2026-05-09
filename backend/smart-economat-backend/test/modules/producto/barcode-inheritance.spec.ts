import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoRepository } from '../../../src/modules/producto/repository/producto.repository';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { ProductoAlergeno } from '../../../src/modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proveedor } from '../../../src/modules/proveedor/proveedor.entity/proveedor.entity';
import { ArchivoService } from '../../../src/modules/archivo/service/archivo.service';

describe('BarcodeInheritance', () => {
  let service: ProductoService;
  let manager: any;

  beforeEach(async () => {
    manager = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ precio: 10 }),
      create: jest.fn().mockImplementation((entity, data) => data),
      save: jest
        .fn()
        .mockImplementation((entity, data) => Promise.resolve(data)),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        {
          provide: ProductoRepository,
          useValue: {
            existsByCodigoBarras: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: getRepositoryToken(ProductoProveedor),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProductoAlergeno),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Proveedor),
          useValue: {},
        },
        {
          provide: ArchivoService,
          useValue: {},
        },
        {
          provide: MovimientoHelper,
          useValue: { trackProductoUpdate: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: { manager },
        },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('debe guardar null en ProductoProveedor si el código de barras coincide con el del producto (herencia)', async () => {
    const productoBarcode = '1234567890123';

    manager.find.mockResolvedValue([]);

    await (service as any).syncProveedoresWithManager(
      manager,
      'prod-1',
      [
        {
          proveedorId: 'prov-1',
          precioUnitario: 10,
          codigoBarras: productoBarcode,
        },
      ],
      productoBarcode
    );

    expect(manager.create).toHaveBeenCalledWith(
      ProductoProveedor,
      expect.objectContaining({
        codigoBarras: null,
      })
    );
  });

  it('debe guardar el código específico si es diferente al del producto (override)', async () => {
    const productoBarcode = '1234567890123';
    const specificBarcode = '9999999999999';

    manager.find.mockResolvedValue([]);

    await (service as any).syncProveedoresWithManager(
      manager,
      'prod-1',
      [
        {
          proveedorId: 'prov-1',
          precioUnitario: 10,
          codigoBarras: specificBarcode,
        },
      ],
      productoBarcode
    );

    expect(manager.create).toHaveBeenCalledWith(
      ProductoProveedor,
      expect.objectContaining({
        codigoBarras: specificBarcode,
      })
    );
  });
});
