import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductoProveedorService } from '../../../src/modules/producto/service/producto-proveedor.service';

describe('ProductoProveedorService', () => {
  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  let service: ProductoProveedorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductoProveedorService(mockDataSource as any);
  });

  it('updatePrecio rechaza cuando el precio no cambia', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 'pp-1', precioUnitario: 10 }),
      save: jest.fn(),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    await expect(
      service.updatePrecio('pp-1', { nuevoPrecio: 10 } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updatePrecio registra el precio nuevo en historial y persiste el vigente', async () => {
    const productoProveedor = { id: 'pp-2', precioUnitario: 12 };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(productoProveedor)
        .mockResolvedValueOnce({ precio: 15 }),
      create: jest.fn((_: unknown, payload: unknown) => payload),
      save: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 'pp-2', precioUnitario: 15 }),
    };
    mockDataSource.transaction.mockImplementation((cb) => cb(manager));

    const result = await service.updatePrecio('pp-2', {
      nuevoPrecio: 15,
    } as any);

    expect(manager.save.mock.calls[0][0].name).toBe('HistorialPrecio');
    expect(manager.save.mock.calls[0][1]).toMatchObject({ precio: 15 });
    expect(result).toEqual({ id: 'pp-2', precioUnitario: 15 });
  });

  it('updatePrecio rechaza precios en 0', async () => {
    await expect(
      service.updatePrecio('pp-1', { nuevoPrecio: 0 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('search devuelve estructura de autocomplete por nombre, marca o barcode', async () => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'pp-3',
          marca: 'Marca X',
          codigoBarras: '123',
          precioUnitario: 8,
          producto: { id: 'prod-1', nombre: 'Arroz' },
          proveedor: { id: 'prov-1', nombre: 'Acme' },
        },
      ]),
    };
    mockDataSource.getRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    });

    const result = await service.search({
      q: 'arr',
      limit: 5,
      offset: 0,
    } as any);

    expect(qb.where).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 'pp-3',
        productoId: 'prod-1',
        productoNombre: 'Arroz',
        proveedorId: 'prov-1',
        proveedorNombre: 'Acme',
        marca: 'Marca X',
        codigoBarras: '123',
        precioUnitario: 8,
      },
    ]);
  });

  it('getHistorial pagina en orden descendente y valida existencia del producto proveedor', async () => {
    mockDataSource.manager.findOne.mockResolvedValue({ id: 'pp-4' });
    const findAndCount = jest.fn().mockResolvedValue([[{ id: 'hist-1' }], 1]);
    mockDataSource.getRepository.mockReturnValue({ findAndCount });

    const result = await service.getHistorial('pp-4', {
      page: 2,
      limit: 10,
    } as any);

    expect(findAndCount).toHaveBeenCalledWith({
      where: { productoProveedor: { id: 'pp-4' } },
      order: { fecha: 'DESC' },
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      data: [{ id: 'hist-1' }],
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    });
  });

  it('getHistorial lanza NotFoundException si el producto proveedor no existe', async () => {
    mockDataSource.manager.findOne.mockResolvedValue(null);

    await expect(
      service.getHistorial('missing', {} as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
