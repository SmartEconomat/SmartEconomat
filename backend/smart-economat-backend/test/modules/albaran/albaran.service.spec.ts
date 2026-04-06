import { NotFoundException } from '@nestjs/common';
import { AlbaranService } from '../../../src/modules/albaran/service/albaran.service';

describe('AlbaranService', () => {
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: false,
      manager: {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('./uploads'),
  };

  const mockArchivoService = {
    compressImageFile: jest.fn().mockImplementation((file: any) =>
      Promise.resolve({
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
      })
    ),
  };

  let service: AlbaranService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.save.mockImplementation((value: unknown) =>
      Promise.resolve(value)
    );
    service = new AlbaranService(
      mockRepo as any,
      mockDataSource as any,
      mockConfigService as any,
      mockArchivoService as any
    );
  });

  it('remove lanza NotFoundException si no existe el albarán', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('missing-albaran')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('findAll deriva la concordancia desde las recepciones vinculadas', async () => {
    mockRepo.findAndCount.mockResolvedValue([
      [
        {
          id: 'alb-1',
          concordancia: null,
          albaranPedidoRecepcion: [
            {
              recepcionPedido: {
                recepcion: {
                  estado: 'COMPLETADA',
                  incidencia: false,
                },
              },
            },
          ],
        },
      ],
      1,
    ]);

    const result = await service.findAll({ page: 1, limit: 20 } as any);

    expect(mockRepo.findAndCount).toHaveBeenCalledWith({
      relations: [
        'albaranPedidoRecepcion',
        'albaranPedidoRecepcion.recepcionPedido',
        'albaranPedidoRecepcion.recepcionPedido.recepcion',
      ],
      order: { fecha: 'DESC' },
      skip: 0,
      take: 20,
      withDeleted: false,
    });
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alb-1',
        concordancia: true,
      })
    );
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: 'alb-1',
          concordancia: true,
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });
});
