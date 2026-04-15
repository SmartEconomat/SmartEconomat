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
 * @description Async class-validator constraint that checks whether a given field value
 * is unique across a TypeORM entity table. Queries the database using the injected
 * `DataSource` and returns `false` (invalid) if a record with the same value already exists.
 * Register this class as a provider in the NestJS DI container so that the `DataSource`
 * dependency can be resolved.
 * @example
 * // In a module:
 * providers: [IsUniqueConstraint]
 */
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  /**
   * @description Injects the TypeORM `DataSource` needed to perform the uniqueness check.
   * @param dataSource - The active TypeORM `DataSource` instance.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * @description Performs the async uniqueness check by querying the repository for the
   * given entity class. Uses the constraint's first argument as the entity class and the
   * second argument (or the property name) as the field to check.
   * @param value - The field value to check for uniqueness.
   * @param args - Validation arguments containing the constraints `[entityClass, field]`
   *   and the property name being validated.
   * @returns `true` if no record with the given value exists (i.e. the value is unique);
   *   `false` otherwise.
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
   * @description Returns the default validation error message when the uniqueness check fails.
   * The message includes the entity class name and the offending property name.
   * @param args - Validation arguments providing the entity class and property name.
   * @returns A human-readable error message string.
   */
  defaultMessage(args: ValidationArguments) {
    const [entityClass] = args.constraints;
    return `${entityClass.name} with this ${args.property} already exists`;
  }
}

/**
 * @description Property decorator factory that registers the {@link IsUniqueConstraint}
 * async validator on a DTO property. Checks that the decorated property's value does not
 * already exist in the specified entity's table column.
 * @param entity - The TypeORM entity class whose table is queried for the uniqueness check.
 * @param field - Optional entity column name to query against. Defaults to the property name.
 * @param validationOptions - Standard class-validator options (e.g. `message`, `groups`).
 * @returns A property decorator that registers the `IsUnique` constraint.
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
