import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * @description Union type for specifying which sort fields are permitted on a list endpoint.
 * Can be a plain string array (field names) or a record that maps public DTO field names
 * to actual database column names.
 * @example
 * // Array form — allowed public field names:
 * const allowed: SortableFieldsConfig = ['nombre', 'precio', 'createdAt'];
 *
 * // Record form — DTO key → DB column mapping:
 * const allowed: SortableFieldsConfig = { nombre: 'producto.nombre', precio: 'producto.precio' };
 */
export type SortableFieldsConfig = string[] | Record<string, string>;

/** @description Internal alias for a class constructor that produces a `PaginationQueryDto` subclass. */
type SortableQueryDtoClass<T extends PaginationQueryDto = PaginationQueryDto> =
  new () => T;

/**
 * @description Extracts the list of allowed sort field names from a {@link SortableFieldsConfig}.
 * For array configs, the array itself is returned; for record configs, the object keys are returned.
 * @param config - The sortable-fields configuration to inspect.
 * @returns An array of allowed sort field name strings.
 */
function getAllowedSortableFields(config: SortableFieldsConfig): string[] {
  return Array.isArray(config) ? config : Object.keys(config);
}

/**
 * @description Transforms raw query-string parameters into a typed, validated
 * `PaginationQueryDto` (or subclass) instance. Uses `plainToInstance` for type
 * coercion and `validateSync` for constraint checking.
 * @template T - The concrete `PaginationQueryDto` subclass to produce.
 * @param query - Raw key-value query parameters from the Express request.
 * @param dtoClass - The DTO class to instantiate. Defaults to `PaginationQueryDto`.
 * @returns The validated DTO instance.
 * @throws {BadRequestException} If any class-validator constraint on the DTO is violated.
 */
export function transformAndValidateSortableQuery<
  T extends PaginationQueryDto = PaginationQueryDto,
>(
  query: Record<string, unknown>,
  dtoClass: SortableQueryDtoClass<T> = PaginationQueryDto as SortableQueryDtoClass<T>
): T {
  const transformedQuery = plainToInstance(dtoClass, query);
  const errors = validateSync(transformedQuery as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {})
    );

    throw new BadRequestException(messages);
  }

  return transformedQuery;
}

/**
 * @description Validates that the requested `sortBy` field is among the permitted fields.
 * When a `sortableFieldMap` record is supplied via {@link SortableFieldsConfig}, only the
 * record's keys (public DTO field names) are checked — not the mapped DB column names.
 * @param sortBy - The sort field requested by the client, or `undefined` if not provided.
 * @param allowedFields - The permitted sortable fields configuration.
 * @throws {BadRequestException} If `sortBy` is defined and is not in the allowed fields list.
 */
export function validateSortableField(
  sortBy: string | undefined,
  allowedFields: SortableFieldsConfig
): void {
  const allowedFieldNames = getAllowedSortableFields(allowedFields);

  if (sortBy && !allowedFieldNames.includes(sortBy)) {
    throw new BadRequestException(
      I18nHelper.getError('INVALID_SORT_FIELD', {
        sortBy,
        allowedFields: allowedFieldNames.join(', '),
      })
    );
  }
}

/**
 * @description NestJS parameter decorator factory that parses, validates, and type-checks
 * the request query string into a `PaginationQueryDto` instance while also enforcing that
 * the `sortBy` field is one of the explicitly allowed values. Combines query transformation
 * (via `plainToInstance`) with sort-field whitelisting in a single declarative decorator.
 * @param allowedFields - Permitted sort field names or a DTO-key-to-DB-column mapping.
 * @param dtoClass - Optional custom `PaginationQueryDto` subclass to use for transformation.
 * @returns A NestJS `ParameterDecorator` that resolves to the validated DTO instance.
 * @throws {BadRequestException} If the query fails DTO validation or the `sortBy` value is not allowed.
 * @example
 * \@Get()
 * findAll(\@SortableFields(['nombre', 'precio']) query: PaginationQueryDto) {
 *   return this.service.findAll(query);
 * }
 */
export const SortableFields = (
  allowedFields: SortableFieldsConfig,
  dtoClass: SortableQueryDtoClass = PaginationQueryDto
): ParameterDecorator =>
  createParamDecorator(
    (
      data: {
        allowedFields: SortableFieldsConfig;
        dtoClass: SortableQueryDtoClass;
      },
      ctx: ExecutionContext
    ) => {
      const request = ctx
        .switchToHttp()
        .getRequest<{ query: Record<string, unknown> }>();
      const transformedQuery = transformAndValidateSortableQuery(
        request.query,
        data.dtoClass
      );

      validateSortableField(transformedQuery.sortBy, data.allowedFields);

      return transformedQuery;
    }
  )({ allowedFields, dtoClass });
