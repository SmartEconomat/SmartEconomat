import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import {
  transformAndValidateSortableQuery,
  validateSortableField,
} from 'src/common/decorators/sortable-fields.decorator';

describe('SortableFields decorator', () => {
  it('acepta un campo de ordenación permitido', () => {
    expect(() =>
      validateSortableField('createdAt', ['createdAt', 'updatedAt'])
    ).not.toThrow();
  });

  it('acepta un alias configurado en forma de mapa', () => {
    expect(() =>
      validateSortableField('fechaCreacion', {
        fechaCreacion: 'createdAt',
        updatedAt: 'updatedAt',
      })
    ).not.toThrow();
  });

  it('rechaza un campo de ordenación no permitido con BadRequestException', () => {
    expect(() =>
      validateSortableField('password', ['createdAt', 'updatedAt'])
    ).toThrow(BadRequestException);
    expect(() =>
      validateSortableField('password', ['createdAt', 'updatedAt'])
    ).toThrow('Campo de ordenación inválido');
  });

  it('transforma page y limit a números usando PaginationQueryDto', () => {
    const query = transformAndValidateSortableQuery({
      page: '1',
      limit: '10',
      order: 'DESC',
      sortBy: 'createdAt',
    });

    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.order).toBe('DESC');
  });
});
