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
 * Representa is unique constraint en el sistema.
 */
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly dataSource Parámetro de entrada para la operación.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Valida validate y aplica las reglas definidas.
   *
   * @param value Parámetro de entrada para la operación.
   * @param args Parámetro de entrada para la operación.
   */
  /**
   * Expone "validate" en smart-economat-backend (Nest).
   * @undefined {unknown} value - Entrada efectiva esperada por el contrato.
   * @undefined {ValidationArguments} args - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<boolean>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de default message dentro del flujo de la aplicación.
   *
   * @param args Parámetro de entrada para la operación.
   */
  /**
   * Expone "defaultMessage" en smart-economat-backend (Nest).
   * @undefined {ValidationArguments} args - Entrada efectiva esperada por el contrato.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  defaultMessage(args: ValidationArguments) {
    const [entityClass] = args.constraints;
    return `${entityClass.name} with this ${args.property} already exists`;
  }
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "IsUnique" en smart-economat-backend (Nest).
 * @undefined {any} entity - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} field - Entrada efectiva esperada por el contrato.
 * @undefined {ValidationOptions | undefined} validationOptions - Entrada efectiva esperada por el contrato.
 * @undefined {(object: object, propertyName: string) => void} Datos efectivos después de ejecutar la operación.
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
