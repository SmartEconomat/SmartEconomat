import { DataSource } from 'typeorm';
import { PedidoRepository } from '../../../src/modules/pedido/repository/pedido.repository';

describe('PedidoRepository', () => {
  it('traduce sortBy=fechaCreacion a createdAt en la consulta paginada', async () => {
    const findAndCount = jest.fn().mockResolvedValue([[{ id: 'pedido-2' }], 1]);

    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;

    const repository = new PedidoRepository(mockDataSource);
    Object.assign(repository, { findAndCount });

    const result = await repository.findAllPaginated(
      {
        page: 1,
        limit: 10,
        sortBy: 'fechaCreacion',
        order: 'DESC',
      },
      true
    );

    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      })
    );

    expect(result).toEqual({
      data: [{ id: 'pedido-2' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });
});
