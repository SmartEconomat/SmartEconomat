import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto } from '../../../src/common/dto/pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('mantiene los valores por defecto esperados', () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.order).toBe('ASC');
  });

  it('rechaza límites mayores de 50', () => {
    const dto = plainToInstance(PaginationQueryDto, { limit: 51 });
    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('rechaza órdenes distintas de ASC o DESC', () => {
    const dto = plainToInstance(PaginationQueryDto, { order: 'INVALID' });
    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'order')).toBe(true);
  });
});
