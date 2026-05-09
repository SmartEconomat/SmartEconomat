import { BadRequestException } from '@nestjs/common';
import { RecetaRepository } from '../../../src/modules/receta/repository/receta.repository';

describe('RecetaRepository', () => {
  const mockQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockRecetaRepo = {
    createQueryBuilder: jest.fn(() => mockQb),
  };

  let repository: RecetaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecetaRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    repository = new RecetaRepository(mockRecetaRepo as any, {} as any);
  });

  it('findAllPaginated construye la consulta con createQueryBuilder', async () => {
    await repository.findAllPaginated(
      {
        page: 1,
        limit: 20,
        sortBy: 'nombre',
        order: 'ASC',
      } as any,
      'ADMIN'
    );

    expect(mockRecetaRepo.createQueryBuilder).toHaveBeenCalledWith('receta');
    expect(mockQb.getManyAndCount).toHaveBeenCalled();
  });

  it('aplica filtro minTiempoMinutos cuando se especifica', async () => {
    await repository.findAllPaginated({
      page: 1,
      limit: 20,
      minTiempoMinutos: 30,
    } as any);

    expect(mockQb.andWhere).toHaveBeenCalledWith(
      'receta.tiempoEstimadoMinutos >= :minTiempo',
      { minTiempo: 30 }
    );
  });

  it('aplica filtro maxTiempoMinutos cuando se especifica', async () => {
    await repository.findAllPaginated({
      page: 1,
      limit: 20,
      maxTiempoMinutos: 59,
    } as any);

    expect(mockQb.andWhere).toHaveBeenCalledWith(
      'receta.tiempoEstimadoMinutos <= :maxTiempo',
      { maxTiempo: 59 }
    );
  });

  it('aplica ambos filtros de tiempo simultáneamente', async () => {
    await repository.findAllPaginated({
      page: 1,
      limit: 20,
      minTiempoMinutos: 30,
      maxTiempoMinutos: 59,
    } as any);

    const calls = mockQb.andWhere.mock.calls;
    const calledWithMin = calls.some(
      ([sql, params]: [string, Record<string, number>]) =>
        sql.includes('>= :minTiempo') && params.minTiempo === 30
    );
    const calledWithMax = calls.some(
      ([sql, params]: [string, Record<string, number>]) =>
        sql.includes('<= :maxTiempo') && params.maxTiempo === 59
    );
    expect(calledWithMin).toBe(true);
    expect(calledWithMax).toBe(true);
  });

  it('lanza BadRequestException cuando min > max', async () => {
    await expect(
      repository.findAllPaginated({
        page: 1,
        limit: 20,
        minTiempoMinutos: 60,
        maxTiempoMinutos: 30,
      } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it('no aplica filtros de tiempo cuando no se especifican', async () => {
    await repository.findAllPaginated({
      page: 1,
      limit: 20,
    } as any);

    const calls = mockQb.andWhere.mock.calls;
    const hasTimeFilter = calls.some(([sql]: [string]) =>
      sql.includes('tiempoEstimadoMinutos')
    );
    expect(hasTimeFilter).toBe(false);
  });
});
