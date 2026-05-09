import { buildFindManyOptions } from '../../../src/common/utils/typeorm-query.helper';

describe('buildFindManyOptions', () => {
  it('construye opciones de paginación y ordenación compatibles con TypeORM', () => {
    const options = buildFindManyOptions(
      {
        page: 2,
        limit: 10,
        sortBy: 'fechaCreacion',
        order: 'DESC',
      },
      'createdAt',
      { fechaCreacion: 'createdAt' }
    );

    expect(options).toEqual({
      skip: 10,
      take: 10,
      order: { createdAt: 'DESC' },
      where: {},
    });
  });

  it('limita el tamaño de página a 50 aunque llegue un valor mayor', () => {
    const options = buildFindManyOptions(
      {
        page: 1,
        limit: 500,
      },
      'createdAt'
    );

    expect(options.take).toBe(100);
    expect(options.skip).toBe(0);
    expect(options.order).toEqual({ createdAt: 'ASC' });
  });
});
