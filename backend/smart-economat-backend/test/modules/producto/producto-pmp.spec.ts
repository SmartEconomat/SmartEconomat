import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Producto } from '../../../src/modules/producto/producto.entity/producto.entity';
import { Inventario } from '../../../src/modules/inventario/inventario.entity/inventario.entity';
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
        { provide: getRepositoryToken(ProductoProveedor), useValue: mockProductoProveedorRepository },
        { provide: getRepositoryToken(ProductoAlergeno), useValue: mockProductoAlergenoRepository },
        { provide: getRepositoryToken(Proveedor), useValue: mockProveedorRepository },
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
      precioUnitario: 10, // Precio pactado
      producto: { id: 'prod-1' },
    };

    const em = {
      findOne: jest.fn().mockResolvedValue(mockPP),
      find: jest.fn().mockResolvedValue([{ cantidadActual: 100 }]), // Stock previo de 100
      update: jest.fn().mockResolvedValue(undefined),
    };

    // Espiamos el recálculo global para no ejecutarlo
    jest.spyOn(service as any, 'recalcularPmpProducto').mockResolvedValue(undefined);

    // Recibimos 1 unidad a 20€.
    // Cálculo esperado:
    // stockAnterior = 100 (ya que total=100+1=101, pero find devolvió 100? No, wait)
    // Si find devuelve 100 y nuevaCantidad es 1, stockAnterior es 100-1 = 99? No.
    // En mi implementación: stockTotalPP = reduce(inventarios).
    // Si queremos stockAnterior=100, inventarios deben sumar 101.
    em.find.mockResolvedValue([{ cantidadActual: 101 }]);

    const pmp = await service.actualizarPMP('pp-1', 1, 20, em as any);

    // stockAnterior = 101 - 1 = 100
    // pmpAnterior = 10 (fallback de precioUnitario)
    // nuevoPmp = (100 * 10 + 1 * 20) / 101 = 1020 / 101 = 10.0990...
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

    jest.spyOn(service as any, 'recalcularPmpProducto').mockResolvedValue(undefined);

    // Recibimos 10 unidades a 15€.
    // stockTotal = 20. nueva = 10. anterior = 10.
    // nuevoPmp = (10 * 5 + 10 * 15) / 20 = (50 + 150) / 20 = 200 / 20 = 10
    const pmp = await service.actualizarPMP('pp-1', 10, 15, em as any);

    expect(pmp).toBe(10);
  });
});
