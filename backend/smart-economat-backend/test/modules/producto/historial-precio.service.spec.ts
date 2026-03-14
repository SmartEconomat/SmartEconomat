import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HistorialPrecioService } from '../../../src/modules/producto/service/historial-precio.service';

describe('HistorialPrecioService', () => {
  const mockHistorialRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAllWithRelations: jest.fn(),
    findOneWithRelations: jest.fn(),
    softRemove: jest.fn(),
  };
  const mockDataSource = {
    manager: {
      findOne: jest.fn(),
    },
  };

  let service: HistorialPrecioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HistorialPrecioService(
      mockHistorialRepo as any,
      mockDataSource as any
    );
  });

  it('create rechaza precio negativo', async () => {
    mockDataSource.manager.findOne.mockResolvedValue({ id: 'pp-1' });

    await expect(
      service.create({ productoProveedorId: 'pp-1', precio: -1 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rechaza producto proveedor inexistente', async () => {
    mockDataSource.manager.findOne.mockResolvedValue(null);

    await expect(
      service.create({ productoProveedorId: 'missing', precio: 10 } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update rechaza precio negativo', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'hist-1' } as any);

    await expect(
      service.update('hist-1', { precio: -4 } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
