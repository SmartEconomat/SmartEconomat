import { DataSource } from 'typeorm';
import { PedidoRepository } from '../../../src/modules/pedido/repository/pedido.repository';

function createQueryBuilderMock() {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([{ id: 'pedido-2' }]),
    clone: jest.fn(),
  };

  const countClone = {
    expressionMap: {
      orderBys: {},
      selectDistinctOn: [] as string[],
      selectDistinct: false,
      skip: undefined,
      take: undefined,
      offset: undefined,
      limit: undefined,
      selects: [] as unknown[],
    },
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ cnt: '1' }),
  };

  queryBuilder.clone.mockReturnValue(countClone);

  return { queryBuilder, countClone };
}

describe('PedidoRepository', () => {
  it('traduce sortBy=fechaCreacion a createdAt en la consulta paginada', async () => {
    const { queryBuilder } = createQueryBuilderMock();

    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;

    const repository = new PedidoRepository(mockDataSource);
    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    const result = await repository.findAllPaginated(
      {
        page: 1,
        limit: 10,
        sortBy: 'fechaCreacion',
        order: 'DESC',
      },
      true
    );

    expect(queryBuilder.distinctOn).toHaveBeenCalledWith(['pedido.id']);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('pedido.id', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'pedido.createdAt',
      'DESC'
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);

    expect(result).toEqual({
      data: [{ id: 'pedido-2' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('usa búsqueda segura por relaciones y texto libre cuando searchTerm no es un UUID', async () => {
    const { queryBuilder } = createQueryBuilderMock();

    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;

    const repository = new PedidoRepository(mockDataSource);
    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    await repository.findAllPaginated(
      {
        page: 1,
        limit: 10,
        searchTerm: 'pe',
        estado: 'pendiente_de_aprobacion',
      },
      true
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        whereFactory: expect.any(Function),
      })
    );
    expect(queryBuilder.distinctOn).toHaveBeenCalledWith(['pedido.id']);
    expect(queryBuilder.addOrderBy).toHaveBeenCalled();
  });
});
