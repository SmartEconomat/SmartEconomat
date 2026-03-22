import { DataSource } from 'typeorm';
import { PedidoRepository } from '../../../src/modules/pedido/repository/pedido.repository';

describe('PedidoRepository', () => {
  it('traduce sortBy=fechaCreacion a createdAt en la consulta paginada', async () => {
    const queryBuilder = {
      distinct: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      clone: jest.fn(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'pedido-2' }]),
      getCount: jest.fn().mockResolvedValue(1),
    };
    queryBuilder.clone.mockReturnValue({
      getCount: queryBuilder.getCount,
    });

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

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
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
    const findAndCount = jest.fn().mockResolvedValue([[{ id: 'pedido-3' }], 1]);

    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;

    const repository = new PedidoRepository(mockDataSource);
    Object.assign(repository, { findAndCount });

    await repository.findAllPaginated(
      {
        page: 1,
        limit: 10,
        searchTerm: 'pe',
        estado: 'pendiente',
      },
      true
    );

    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({
            estado: 'pendiente',
            observaciones: expect.any(Object),
          }),
          expect.objectContaining({
            estado: 'pendiente',
            proveedor: expect.objectContaining({
              nombre: expect.any(Object),
            }),
          }),
          expect.objectContaining({
            estado: 'pendiente',
            usuario: expect.objectContaining({
              username: expect.any(Object),
            }),
          }),
        ]),
      })
    );

    const calledWhere = findAndCount.mock.calls[0][0].where as Array<{
      id?: unknown;
    }>;

    expect(calledWhere.some((condition) => 'id' in condition)).toBe(false);
  });
});
