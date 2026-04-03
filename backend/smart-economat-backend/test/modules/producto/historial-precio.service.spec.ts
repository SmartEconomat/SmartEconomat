import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HistorialPrecioService } from '../../../src/modules/producto/service/historial-precio.service';

describe('HistorialPrecioService', () => {
  const createUpdateQueryBuilderMock = () => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  });

  const mockHistorialRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAllWithRelations: jest.fn(),
    findOneWithRelations: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn((_: unknown, payload: unknown) => payload),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest
      .fn()
      .mockImplementation(() => createUpdateQueryBuilderMock()),
    softRemove: jest.fn().mockResolvedValue(undefined),
  };

  const mockDataSource = {
    manager: mockManager,
    transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockManager)),
  };

  let service: HistorialPrecioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HistorialPrecioService(
      mockHistorialRepo as any,
      mockDataSource as any
    );
  });

  it('create rechaza precio menor o igual a 0', async () => {
    mockManager.findOne.mockResolvedValue({ id: 'pp-1' });

    await expect(
      service.create({ productoProveedorId: 'pp-1', precio: 0 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rechaza producto proveedor inexistente', async () => {
    mockManager.findOne.mockResolvedValue(null);

    await expect(
      service.create({ productoProveedorId: 'missing', precio: 10 } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create sincroniza precio actual con el último historial', async () => {
    mockManager.findOne
      .mockResolvedValueOnce({ id: 'pp-1' })
      .mockResolvedValueOnce({ precio: 12 });
    mockManager.save.mockResolvedValue({
      id: 'hist-1',
      productoProveedorId: 'pp-1',
      precio: 12,
    });

    await service.create({ productoProveedorId: 'pp-1', precio: 12 } as any);

    expect(mockManager.update).toHaveBeenCalledWith(
      expect.any(Function),
      { id: 'pp-1' },
      { precioUnitario: 12 }
    );
  });

  it('update rechaza precio menor o igual a 0', async () => {
    mockManager.findOne.mockResolvedValue({
      id: 'hist-1',
      productoProveedorId: 'pp-1',
    });

    await expect(
      service.update('hist-1', { precio: 0 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
