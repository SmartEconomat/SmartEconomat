import { NotFoundException } from '@nestjs/common';
import { InventarioService } from '../../../src/modules/inventario/service/inventario.service';
import { TipoMovimiento } from '../../../src/modules/movimiento/enums/movimiento.enums';

describe('InventarioService', () => {
  const mockInventarioRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    findCaducidadProxima: jest.fn(),
    findStockBajo: jest.fn(),
    queryStock: jest.fn(),
  };
  const mockProductoProveedorRepo = {
    findOne: jest.fn(),
  };
  const mockMovimientoHelper = {
    trackInventarioMovimiento: jest.fn(),
  };

  let service: InventarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventarioService(
      mockInventarioRepo as any,
      mockProductoProveedorRepo as any,
      mockMovimientoHelper as any
    );
  });

  it('create valida la existencia del ProductoProveedor', async () => {
    mockProductoProveedorRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({ productoProveedorId: 'missing' } as any, 'user-1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create genera un movimiento de entrada', async () => {
    mockProductoProveedorRepo.findOne.mockResolvedValue({
      id: 'pp-1',
      producto: { nombre: 'Arroz' },
    });
    mockInventarioRepo.create.mockImplementation((payload: unknown) => payload);
    mockInventarioRepo.save.mockResolvedValue({ id: 'inv-1' });

    await service.create(
      {
        productoProveedorId: 'pp-1',
        cantidadActual: 10,
        cantidadMinima: 2,
        ubicacionId: 'ubi-1',
      } as any,
      'user-2'
    );

    expect(mockMovimientoHelper.trackInventarioMovimiento).toHaveBeenCalledWith(
      'user-2',
      'inv-1',
      TipoMovimiento.ENTRADA,
      10,
      'pp-1',
      'Inventario',
      'inv-1',
      'Creación de inventario: Arroz'
    );
  });

  it('update genera movimiento ENTRADA si incrementa la cantidad', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({
        id: 'inv-2',
        cantidadActual: 4,
        productoProveedor: { id: 'pp-2', producto: { nombre: 'Leche' } },
      } as any)
      .mockResolvedValueOnce({ id: 'inv-2' } as any);
    mockInventarioRepo.save.mockResolvedValue(undefined);

    await service.update('inv-2', { cantidadActual: 7 } as any, 'user-3');

    expect(mockMovimientoHelper.trackInventarioMovimiento).toHaveBeenCalledWith(
      'user-3',
      'inv-2',
      TipoMovimiento.ENTRADA,
      3,
      'pp-2',
      'Inventario',
      'inv-2',
      'Ajuste de inventario: Leche (4 -> 7)'
    );
  });

  it('remove genera movimiento SALIDA con toda la cantidad actual', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'inv-3',
      cantidadActual: 5,
      productoProveedor: { id: 'pp-3', producto: { nombre: 'Aceite' } },
    } as any);
    mockInventarioRepo.softDelete.mockResolvedValue({ affected: 1 });

    await service.remove('inv-3', 'user-4');

    expect(mockMovimientoHelper.trackInventarioMovimiento).toHaveBeenCalledWith(
      'user-4',
      'inv-3',
      TipoMovimiento.SALIDA,
      5,
      'pp-3',
      'Inventario',
      'inv-3',
      'Eliminación de inventario: Aceite'
    );
  });

  it('obtenerAlertasCaducidad devuelve solo fechas serializadas', async () => {
    mockInventarioRepo.findCaducidadProxima.mockResolvedValue([
      { id: 'inv-4', fechaCaducidad: new Date('2026-03-20T00:00:00.000Z') },
      { id: 'inv-5', fechaCaducidad: null },
    ]);

    const result = await service.obtenerAlertasCaducidad();

    expect(result).toEqual([
      { id: 'inv-4', fechaCaducidad: '2026-03-20T00:00:00.000Z' },
    ]);
  });

  it('obtenerAlertasStock mapea cantidad actual y mínima', async () => {
    mockInventarioRepo.findStockBajo.mockResolvedValue([
      { id: 'inv-6', cantidadActual: 1, cantidadMinima: 3 },
    ]);

    await expect(service.obtenerAlertasStock()).resolves.toEqual([
      { id: 'inv-6', cantidadActual: 1, cantidadMinima: 3 },
    ]);
  });
});
