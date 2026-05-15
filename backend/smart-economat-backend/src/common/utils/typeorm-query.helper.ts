/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import {
  FindManyOptions,
  ILike,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { BaseQueryDto } from '../dto/base-query.dto';

/**
 * Helper para construir las opciones de búsqueda de TypeORM (paginación, ordenación, filtrado).
 */
/**
 * Expone "buildFindManyOptions" en smart-economat-backend (Nest).
 * @undefined {BaseQueryDto} query - Entrada efectiva esperada por el contrato.
 * @undefined {string} defaultSortField - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, string> | undefined} sortableFieldMap - Entrada efectiva esperada por el contrato.
 * @undefined {Pick<FindManyOptions<T>, "skip" | "take" | "order" | "where">} Datos efectivos después de ejecutar la operación.
 */
export function buildFindManyOptions<T>(
  query: BaseQueryDto,
  defaultSortField = 'createdAt',
  sortableFieldMap?: Record<string, string>
): Pick<FindManyOptions<T>, 'skip' | 'take' | 'order' | 'where'> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const requestedSortField = query.sortBy ?? defaultSortField;
  const sortBy = sortableFieldMap?.[requestedSortField] ?? requestedSortField;
  const order = query.order ?? 'ASC';

  const where: Record<string, unknown> = {};

  if (query.filters) {
    Object.entries(query.filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string') {
        where[key] = ILike(`%${value}%`);
      } else if (typeof value === 'object' && value !== null) {
        const range = value as { from?: unknown; to?: unknown };
        if (range.from && range.to) {
          where[key] = Between(range.from, range.to);
        } else if (range.from) {
          where[key] = MoreThanOrEqual(range.from);
        } else if (range.to) {
          where[key] = LessThanOrEqual(range.to);
        }
      } else {
        where[key] = value;
      }
    });
  }

  return {
    skip: (page - 1) * limit,
    take: limit,
    order: { [sortBy]: order } as FindManyOptions<T>['order'],
    where: where as FindManyOptions<T>['where'],
  };
}
