import { BadRequestException } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';

jest.mock(
  'exceljs',
  () => ({
    stream: {
      xlsx: {
        WorkbookWriter: jest.fn(),
      },
    },
  }),
  { virtual: true }
);

jest.mock('pdfkit', () => jest.fn(), { virtual: true });

import { ExportService } from '../../../src/modules/export/service/export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService({} as DataSource);
  });

  it('throws when the export exceeds the configured row limit', async () => {
    const mockQueryBuilder = {
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(101),
    } as unknown as SelectQueryBuilder<object>;

    await expect(
      service['ensureWithinLimit'](mockQueryBuilder, 100)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows exporting when the row count is within the configured limit', async () => {
    const mockQueryBuilder = {
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(100),
    } as unknown as SelectQueryBuilder<object>;

    await expect(
      service['ensureWithinLimit'](mockQueryBuilder, 100)
    ).resolves.toBeUndefined();
  });
});
