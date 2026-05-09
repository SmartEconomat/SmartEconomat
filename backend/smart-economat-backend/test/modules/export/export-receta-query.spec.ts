import { DataSource } from 'typeorm';
import { ExportService } from '../../../src/modules/export/service/export.service';
import { ExportRecetaFilterDto } from '../../../src/modules/export/dto/export-receta-filter.dto';
import { Receta } from '../../../src/modules/receta/receta.entity/receta.entity';

describe('ExportService - buildRecetaQueryBuilder', () => {
  let service: ExportService;
  let mockDataSource: DataSource;
  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
  };
  /** Referencia estable al mock `createQueryBuilder` (evita `unbound-method` en asserts). */
  let createQueryBuilderMock: jest.Mock;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    createQueryBuilderMock = jest.fn().mockReturnValue(mockQueryBuilder);

    mockDataSource = {
      createQueryBuilder: createQueryBuilderMock,
    } as unknown as DataSource;

    service = new ExportService(mockDataSource);
  });

  it('should build a query with ids filter', () => {
    const query: ExportRecetaFilterDto = {
      ids: ['id1', 'id2'],
    };

    (service as any).buildRecetaQueryBuilder(query);

    expect(createQueryBuilderMock).toHaveBeenCalledWith(Receta, 'receta');
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'receta.id IN (:...ids)',
      { ids: ['id1', 'id2'] }
    );
  });

  it('should build a query with searchTerm and time filters', () => {
    const query: ExportRecetaFilterDto = {
      searchTerm: 'tarta',
      minTiempoMinutos: 10,
      maxTiempoMinutos: 30,
    };

    (service as any).buildRecetaQueryBuilder(query);

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'receta.nombre ILIKE :search',
      { search: '%tarta%' }
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'receta.tiempoEstimadoMinutos >= :minTiempoMinutos',
      { minTiempoMinutos: 10 }
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'receta.tiempoEstimadoMinutos <= :maxTiempoMinutos',
      { maxTiempoMinutos: 30 }
    );
  });
});
