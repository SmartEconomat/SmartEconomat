import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ArchivoService } from '../../../src/modules/archivo/service/archivo.service';
import { rolUsuario } from '../../../src/modules/usuario/enums/usuario.enums';

describe('ArchivoService', () => {
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };
  const mockConfig = {
    get: jest.fn().mockImplementation((key: string, fallback: string) => {
      if (key === 'STORAGE_TYPE') return 'local';
      if (key === 'LOCAL_STORAGE_PATH') return './uploads';
      return fallback;
    }),
  };

  let service: ArchivoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArchivoService(mockRepo as any, mockConfig as any);
  });

  it('uploadFile procesa imágenes cuando shouldProcess=true', async () => {
    const file = {
      filename: 'image.png',
      originalname: 'image.png',
      mimetype: 'image/png',
      size: 100,
      path: '/tmp/image.png',
    };
    const user = { id: 'user-1' };

    jest.spyOn(service as any, 'processImage').mockResolvedValue({
      path: '/tmp/image_optimized.webp',
      size: 50,
      mimeType: 'image/webp',
    });
    mockRepo.create.mockImplementation((payload: unknown) => payload);
    mockRepo.save.mockImplementation((payload: unknown) =>
      Promise.resolve(payload)
    );

    const result = await service.uploadFile(file as any, user as any);

    expect((service as any).processImage).toHaveBeenCalled();
    expect(result).toMatchObject({
      url: '/api/v1/archivos/content/image.png',
      urlOptimized: '/api/v1/archivos/content/image_optimized.webp',
      mimeTypeOptimized: 'image/webp',
    });
  });

  it('uploadFile almacena directamente si no se procesa', async () => {
    const file = {
      filename: 'doc.pdf',
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 150,
      path: '/tmp/doc.pdf',
    };
    mockRepo.create.mockImplementation((payload: unknown) => payload);
    mockRepo.save.mockImplementation((payload: unknown) =>
      Promise.resolve(payload)
    );

    const result = await service.uploadFile(
      file as any,
      { id: 'user-2' } as any,
      undefined,
      false
    );

    expect(result).toMatchObject({
      url: '/api/v1/archivos/content/doc.pdf',
      urlOptimized: undefined,
    });
  });

  it('getFileContent previene directory traversal', () => {
    expect(() => service.getFileContent('../etc/passwd')).toThrow(
      BadRequestException
    );
  });

  it('remove solo permite owner o admin', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'file-1',
      usuario: { id: 'owner-1' },
    } as any);

    await expect(
      service.remove('file-1', { id: 'user-3', rol: rolUsuario.ALUMNO } as any)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAll filtra por usuarioId y mimeType', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'file-2' }], 1]),
    };
    mockRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      usuarioId: 'user-4',
      mimeType: 'image/png',
    } as any);

    expect(qb.andWhere).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      data: [{ id: 'file-2' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });
});
