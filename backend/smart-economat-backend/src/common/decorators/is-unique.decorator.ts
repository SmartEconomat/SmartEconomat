import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * @description Restricción asíncrona de class-validator que verifica si un valor de campo dado
 * es único en la tabla de una entidad TypeORM. Consulta la base de datos usando el
 * `DataSource` inyectado y devuelve `false` (inválido) si ya existe un registro con el mismo valor.
 * Registra esta clase como proveedor en el contenedor DI de NestJS para que la dependencia
 * `DataSource` pueda resolverse.
 * @example
 *
 * providers: [IsUniqueConstraint]
 */
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  /**
   * @description Inyecta el `DataSource` de TypeORM necesario para realizar la comprobación de unicidad.
   * @param dataSource - La instancia activa de `DataSource` de TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * @description Realiza la comprobación asíncrona de unicidad consultando el repositorio para la
   * clase de entidad dada. Usa el primer argumento de la restricción como clase de entidad y el
   * segundo argumento (o el nombre de la propiedad) como campo a comprobar.
   * @param value - El valor del campo cuya unicidad se comprueba.
   * @param args - Argumentos de validación que contienen las restricciones `[entityClass, field]`
   *   y el nombre de la propiedad que se está validando.
   * @returns `true` si no existe ningún registro con el valor dado (es decir, el valor es único);
   *   `false` en caso contrario.
   */
  async validate(value: unknown, args: ValidationArguments) {
    const [entityClass, field] = args.constraints as [new () => object, string];
    const repository = this.dataSource.getRepository(entityClass);
    const exists = await repository.findOne({
      where: { [field || args.property]: value } as Record<string, unknown>,
    });
    return !exists;
  }

  /**
   * @description Devuelve el mensaje de error de validación por defecto cuando falla la comprobación de unicidad.
   * El mensaje incluye el nombre de la clase de entidad y el nombre de la propiedad que causó el error.
   * @param args - Argumentos de validación que proporcionan la clase de entidad y el nombre de la propiedad.
   * @returns Una cadena de mensaje de error legible por humanos.
   */
  defaultMessage(args: ValidationArguments) {
    const [entityClass] = args.constraints;
    return `${entityClass.name} with this ${args.property} already exists`;
  }
}

/**
 * @description Fábrica de decoradores de propiedad que registra el validador asíncrono
 * {@link IsUniqueConstraint} en una propiedad DTO. Comprueba que el valor de la propiedad
 * decorada no exista ya en la columna de tabla de la entidad especificada.
 * @param entity - La clase de entidad TypeORM cuya tabla se consulta para la comprobación de unicidad.
 * @param field - Nombre de columna de entidad opcional contra la que consultar. Por defecto, el nombre de la propiedad.
 * @param validationOptions - Opciones estándar de class-validator (p. ej. `message`, `groups`).
 * @returns Un decorador de propiedad que registra la restricción `IsUnique`.
 * @example
 * export class CreateUsuarioDto {
 *   \@IsUnique(Usuario, 'email')
 *   email: string;
 * }
 */
export function IsUnique(
  entity: any,
  field?: string,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, field],
      validator: IsUniqueConstraint,
    });
  };
}
