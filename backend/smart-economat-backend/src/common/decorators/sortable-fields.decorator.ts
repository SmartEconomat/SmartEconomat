import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export type SortableFieldsConfig = string[] | Record<string, string>;
type SortableQueryDtoClass<T extends PaginationQueryDto = PaginationQueryDto> =
  new () => T;

function getAllowedSortableFields(config: SortableFieldsConfig): string[] {
  return Array.isArray(config) ? config : Object.keys(config);
}

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

export function validateSortableField(
  sortBy: string | undefined,
  allowedFields: SortableFieldsConfig
): void {
  const allowedFieldNames = getAllowedSortableFields(allowedFields);

  if (sortBy && !allowedFieldNames.includes(sortBy)) {
    throw new BadRequestException(
      `Campo de ordenación inválido: "${sortBy}". Campos permitidos: ${allowedFieldNames.join(', ')}`
    );
  }
}

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
