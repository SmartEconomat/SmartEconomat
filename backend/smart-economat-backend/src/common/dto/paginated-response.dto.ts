/**
 * @module PaginatedResponseDto
 * Generic DTO that wraps paginated list results returned by the API.
 * Used consistently across all list endpoints that support pagination.
 */

/**
 * Generic paginated response container.
 *
 * @template T - The type of each item in the `data` array.
 *
 * @example
 * // Service usage
 * const result: PaginatedResponseDto<ProductoDto> = {
 *   data: [...],
 *   total: 150,
 *   page: 2,
 *   limit: 20,
 *   totalPages: 8,
 * };
 */
export class PaginatedResponseDto<T> {
  /** Array of items for the current page. */
  data: T[];

  /** Total number of records matching the query (across all pages). */
  total: number;

  /** Current page number (1-based). */
  page: number;

  /** Maximum number of items per page. */
  limit: number;

  /** Total number of pages calculated as `Math.ceil(total / limit)`. */
  totalPages: number;
}
