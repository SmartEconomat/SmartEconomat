/**
 * @module TypeOrmQueryHelper
 * Utility functions that translate {@link PaginationQueryDto} parameters into
 * TypeORM `FindManyOptions` fragments, keeping pagination/sorting logic
 * centralised and reusable across all repository/service layers.
 */

import { FindManyOptions } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

/**
 * Converts a {@link PaginationQueryDto} into the `skip`, `take`, and `order`
 * portions of a TypeORM {@link FindManyOptions} object.
 *
 * Caps the page size at 50 records regardless of the requested `limit` to
 * prevent excessively large queries.
 *
 * @template T - The entity type for which options are being built.
 *
 * @param {PaginationQueryDto} query - Incoming pagination and sorting parameters.
 * @param {string} [defaultSortField='createdAt'] - The field name to sort by when
 *   the caller does not specify `sortBy`.
 * @param {Record<string, string>} [sortableFieldMap] - Optional map from DTO field
 *   names to entity column names, used to translate public sort keys to actual DB columns.
 * @returns {Pick<FindManyOptions<T>, 'skip' | 'take' | 'order'>} A partial
 *   `FindManyOptions` object ready to be spread into a `findMany` / `findAndCount` call.
 *
 * @example
 * const options = buildFindManyOptions(query, 'nombre', { nombre: 'producto.nombre' });
 * const [items, total] = await repo.findAndCount({ ...options, relations: ['proveedor'] });
 */
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
