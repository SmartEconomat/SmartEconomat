import { FindManyOptions } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export function buildFindManyOptions<T>(
  query: PaginationQueryDto,
  defaultSortField = 'createdAt',
  sortableFieldMap?: Record<string, string>
): Pick<FindManyOptions<T>, 'skip' | 'take' | 'order'> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 50);
  const requestedSortField = query.sortBy ?? defaultSortField;
  const sortBy = sortableFieldMap?.[requestedSortField] ?? requestedSortField;
  const order = query.order ?? 'ASC';

  return {
    skip: (page - 1) * limit,
    take: limit,
    order: { [sortBy]: order } as FindManyOptions<T>['order'],
  };
}
