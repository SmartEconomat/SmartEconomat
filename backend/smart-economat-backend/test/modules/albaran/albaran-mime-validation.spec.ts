import { BadRequestException } from '@nestjs/common';
import { AlbaranService } from '../../../src/modules/albaran/service/albaran.service';

/**
 * Tests de regresión para ALBARAN-002:
 * El upload de documentos debe validar MIME type y tamaño máximo.
 */
describe('AlbaranService.uploadDocumento — validación MIME y tamaño', () => {
  const mockAlbaranRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockDataSource = { createQueryRunner: jest.fn() };
  const mockConfig = { get: jest.fn() };
  const mockArchivoService = { compressImageFile: jest.fn() };

  let service: AlbaranService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlbaranService(
      mockAlbaranRepo as any,
      mockDataSource as any,
      mockConfig as any,
      mockArchivoService as any
    );
  });

  function makeFile(mimetype: string, size: number): Express.Multer.File {
    return {
      mimetype,
      size,
      filename: 'test',
      path: '/tmp/test',
      originalname: 'test',
    } as any;
  }

  it('rechaza archivos sin file (null)', async () => {
    await expect(
      service.uploadDocumento(
        null as any,
        { numeroReferencia: 'ALB-001' } as any
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza MIME no permitido (text/plain)', async () => {
    const file = makeFile('text/plain', 1000);
    await expect(
      service.uploadDocumento(file, { numeroReferencia: 'ALB-001' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza MIME no permitido (video/mp4)', async () => {
    const file = makeFile('video/mp4', 1000);
    await expect(
      service.uploadDocumento(file, { numeroReferencia: 'ALB-001' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza archivo mayor de 10 MB', async () => {
    const file = makeFile('image/jpeg', 11 * 1024 * 1024);
    await expect(
      service.uploadDocumento(file, { numeroReferencia: 'ALB-001' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('acepta image/jpeg dentro del límite (no falla por MIME ni tamaño)', async () => {
    const file = makeFile('image/jpeg', 5 * 1024 * 1024);
    mockArchivoService.compressImageFile.mockResolvedValue({
      filename: 'f.jpg',
      path: '/tmp/f.jpg',
      size: 5000,
      mimeType: 'image/jpeg',
    });
    const qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({ nAlbaran: 'ALB-001' }),
        save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
        find: jest.fn().mockResolvedValue([]),
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    };
    mockDataSource.createQueryRunner.mockReturnValue(qr);

    try {
      await service.uploadDocumento(file, {
        numeroReferencia: 'ALB-001',
      } as any);
    } catch (err: any) {
      expect(err?.message ?? '').not.toContain('Tipo de archivo');
      expect(err?.message ?? '').not.toContain('10 MB');
    }
  });

  it('acepta application/pdf dentro del límite (no falla por MIME ni tamaño)', async () => {
    const file = makeFile('application/pdf', 2 * 1024 * 1024);
    mockArchivoService.compressImageFile.mockResolvedValue({
      filename: 'f.pdf',
      path: '/tmp/f.pdf',
      size: 2000000,
      mimeType: 'application/pdf',
    });
    const qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({ nAlbaran: 'ALB-PDF' }),
        save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
        find: jest.fn().mockResolvedValue([]),
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    };
    mockDataSource.createQueryRunner.mockReturnValue(qr);

    try {
      await service.uploadDocumento(file, {
        numeroReferencia: 'ALB-PDF',
      } as any);
    } catch (err: any) {
      expect(err?.message ?? '').not.toContain('Tipo de archivo');
      expect(err?.message ?? '').not.toContain('10 MB');
    }
  });
});
