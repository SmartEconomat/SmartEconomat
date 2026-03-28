import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InventarioService } from '../../../src/modules/inventario/service/inventario.service';
import {
  TipoMovimiento,
  TipoMovimientoManual,
} from '../../../src/modules/movimiento/enums/movimiento.enums';

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
  const mockDataSource = {
    transaction: jest.fn(),
  };

  let service: InventarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventarioService(
      mockInventarioRepo as any,
      mockProductoProveedorRepo as any,
      mockMovimientoHelper as any,
      mockDataSource as any
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

  it('ajustarManual actualiza stock y registra movimiento en transacción', async () => {
    const inventario = {
      id: 'inv-7',
      cantidadActual: 10,
      productoProveedor: {
        id: 'pp-7',
        producto: { nombre: 'Harina' },
      },
      ajustarCantidad(delta: number) {
        this.cantidadActual = Number(this.cantidadActual) + delta;
        if (this.cantidadActual < 0) {
          throw new Error('stock negativo');
        }
      },
    };

    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(inventario),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest
        .fn()
        .mockImplementation((_entity: unknown, payload: unknown) => payload),
      create: jest
        .fn()
        .mockImplementation((_entity: unknown, payload: unknown) => payload),
    };

    mockDataSource.transaction.mockImplementation((callback: any) =>
      callback(manager)
    );

    const result = await service.ajustarManual(
      {
        inventarioId: 'inv-7',
        tipo: TipoMovimiento.SALIDA_AJUSTE as any,
        ajuste: -4,
        motivo: 'Rotura interna',
        observaciones: 'Botella dañada',
      },
      'user-7'
    );

    expect(Number(result.cantidadActual)).toBe(6);
    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      inventario
    );
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tipo: TipoMovimiento.SALIDA_AJUSTE,
        cantidad: 4,
        entidad: 'AjusteManualInventario',
        usuario: { id: 'user-7' },
        descripcion: expect.stringContaining('MANUAL'),
      })
    );
  });

  it('ajustarManual rechaza signos inconsistentes para entrada manual', async () => {
    await expect(
      service.ajustarManual(
        {
          inventarioId: 'inv-9',
          tipo: TipoMovimientoManual.ENTRADA,
          ajuste: -1,
          motivo: 'Corrección inválida',
        },
        'user-9'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('ajustarManual rechaza ajuste 0 antes de abrir la transacción', async () => {
    await expect(
      service.ajustarManual(
        {
          inventarioId: 'inv-11',
          tipo: TipoMovimientoManual.AJUSTE,
          ajuste: 0,
          motivo: 'Regularización nula',
        },
        'user-11'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('ajustarManual rechaza salidas con ajuste positivo', async () => {
    await expect(
      service.ajustarManual(
        {
          inventarioId: 'inv-12',
          tipo: TipoMovimientoManual.SALIDA_AJUSTE,
          ajuste: 2,
          motivo: 'Salida inconsistente',
        },
        'user-12'
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('ajustarManual lanza NotFoundException si no existe el inventario', async () => {
    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation((callback: any) =>
      callback(manager)
    );

    await expect(
      service.ajustarManual(
        {
          inventarioId: 'inv-missing',
          tipo: TipoMovimientoManual.AJUSTE,
          ajuste: 3,
          motivo: 'Regularización de inventario',
        },
        'user-10'
      )
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(manager.save).not.toHaveBeenCalled();
  });

  it('ajustarManual rechaza stock negativo', async () => {
    const inventario = {
      id: 'inv-8',
      cantidadActual: 2,
      productoProveedor: {
        id: 'pp-8',
        producto: { nombre: 'Levadura' },
      },
      ajustarCantidad() {
        throw new Error('stock negativo');
      },
    };

    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(inventario),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation((callback: any) =>
      callback(manager)
    );

    await expect(
      service.ajustarManual(
        {
          inventarioId: 'inv-8',
          tipo: TipoMovimiento.SALIDA_AJUSTE as any,
          ajuste: -5,
          motivo: 'Merma',
        },
        'user-8'
      )
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
