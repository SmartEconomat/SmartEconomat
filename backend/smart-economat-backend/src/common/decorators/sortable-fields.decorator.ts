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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type SortableFieldsConfig = string[] | Record<string, string>;

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type SortableQueryDtoClass<T extends PaginationQueryDto = PaginationQueryDto> =
  new () => T;

/**
 * Obtiene allowed sortable fields.
 *
 * @param config Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function getAllowedSortableFields(config: SortableFieldsConfig): string[] {
  return Array.isArray(config) ? config : Object.keys(config);
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "transformAndValidateSortableQuery" en smart-economat-backend (Nest).
 * @undefined {Record<string, unknown>} query - Entrada efectiva esperada por el contrato.
 * @undefined {SortableQueryDtoClass<T>} dtoClass - Entrada efectiva esperada por el contrato.
 * @undefined {T} Datos efectivos después de ejecutar la operación.
 */
export function transformAndValidateSortableQuery<
  T extends PaginationQueryDto = PaginationQueryDto,
>(
  query: Record<string, unknown>,
  dtoClass: SortableQueryDtoClass<T> = PaginationQueryDto as SortableQueryDtoClass<T>
): T {
  const normalizedQuery = { ...query };
  if (!normalizedQuery.order && typeof normalizedQuery.sortOrder === 'string') {
    normalizedQuery.order = normalizedQuery.sortOrder;
  }
  if (typeof normalizedQuery.order === 'string') {
    normalizedQuery.order = normalizedQuery.order.toUpperCase();
  }

  const transformedQuery = plainToInstance(dtoClass, normalizedQuery);
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "validateSortableField" en smart-economat-backend (Nest).
 * @undefined {string | undefined} sortBy - Entrada efectiva esperada por el contrato.
 * @undefined {SortableFieldsConfig} allowedFields - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "SortableFields" en smart-economat-backend (Nest).
 * @undefined {SortableFieldsConfig} allowedFields - Entrada efectiva esperada por el contrato.
 * @undefined {SortableQueryDtoClass<PaginationQueryDto>} dtoClass - Entrada efectiva esperada por el contrato.
 * @undefined {ParameterDecorator} Datos efectivos después de ejecutar la operación.
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
