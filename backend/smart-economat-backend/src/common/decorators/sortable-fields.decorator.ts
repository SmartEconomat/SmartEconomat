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
 * @description Tipo unión para especificar qué campos de ordenación están permitidos en un endpoint de listado.
 * Puede ser un array de cadenas (nombres de campo) o un registro que mapea nombres de campo públicos del DTO
 * a nombres de columna reales de la base de datos.
 * @example
 *
 * const allowed: SortableFieldsConfig = ['nombre', 'precio', 'createdAt'];
 *
 *
 * const allowed: SortableFieldsConfig = { nombre: 'producto.nombre', precio: 'producto.precio' };
 */
export type SortableFieldsConfig = string[] | Record<string, string>;

/** @description Alias interno para un constructor de clase que produce una subclase de `PaginationQueryDto`. */
type SortableQueryDtoClass<T extends PaginationQueryDto = PaginationQueryDto> =
  new () => T;

/**
 * @description Extrae la lista de nombres de campo de ordenación permitidos de una {@link SortableFieldsConfig}.
 * Para configuraciones en array, se devuelve el propio array; para configuraciones en registro, se devuelven las claves del objeto.
 * @param config - La configuración de campos ordenables a inspeccionar.
 * @returns Un array de cadenas con los nombres de campo de ordenación permitidos.
 */
function getAllowedSortableFields(config: SortableFieldsConfig): string[] {
  return Array.isArray(config) ? config : Object.keys(config);
}

/**
 * @description Transforma parámetros brutos de cadena de consulta en una instancia tipada y validada
 * de `PaginationQueryDto` (o subclase). Usa `plainToInstance` para la conversión de tipos
 * y `validateSync` para la comprobación de restricciones.
 * @template T - La subclase concreta de `PaginationQueryDto` a producir.
 * @param query - Parámetros brutos clave-valor de la petición Express.
 * @param dtoClass - La clase DTO a instanciar. Por defecto `PaginationQueryDto`.
 * @returns La instancia validada del DTO.
 * @throws {BadRequestException} Si se viola alguna restricción de class-validator en el DTO.
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
 * @description Valida que el campo `sortBy` solicitado esté entre los campos permitidos.
 * Cuando se proporciona un registro `sortableFieldMap` mediante {@link SortableFieldsConfig}, solo se
 * comprueban las claves del registro (nombres de campo públicos del DTO), no los nombres de columna de BD mapeados.
 * @param sortBy - El campo de ordenación solicitado por el cliente, o `undefined` si no se proporcionó.
 * @param allowedFields - La configuración de campos ordenables permitidos.
 * @throws {BadRequestException} Si `sortBy` está definido y no está en la lista de campos permitidos.
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
 * @description Fábrica de decoradores de parámetro de NestJS que analiza, valida y comprueba el tipo
 * de la cadena de consulta de la petición en una instancia de `PaginationQueryDto`, al mismo tiempo que
 * exige que el campo `sortBy` sea uno de los valores explícitamente permitidos. Combina la transformación
 * de la consulta (mediante `plainToInstance`) con la lista blanca de campos de ordenación en un único decorador declarativo.
 * @param allowedFields - Nombres de campos de ordenación permitidos o un mapeo de clave DTO a columna de BD.
 * @param dtoClass - Subclase personalizada opcional de `PaginationQueryDto` para usar en la transformación.
 * @returns Un `ParameterDecorator` de NestJS que se resuelve en la instancia validada del DTO.
 * @throws {BadRequestException} Si la consulta no supera la validación del DTO o el valor de `sortBy` no está permitido.
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
