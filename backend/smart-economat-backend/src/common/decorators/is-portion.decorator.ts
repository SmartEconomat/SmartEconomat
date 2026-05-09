import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador para asegurar que un número es múltiplo de 0.5.
 * Útil para raciones y porciones en el contexto de cocina.
 */
@ValidatorConstraint({ name: 'IsPortion', async: false })
export class IsPortionConstraint implements ValidatorConstraintInterface {
  /**
   * Valida si el valor es un número mayor que 0 y múltiplo de 0.5.
   */
  /**
   * Expone "validate" en smart-economat-backend (Nest).
   * @undefined {any} value - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  validate(value: any) {
    if (typeof value !== 'number') return false;
    if (value <= 0) return false;

    return Number.isInteger(value * 2);
  }

  /**
   * Mensaje de error por defecto.
   */
  /**
   * Expone "defaultMessage" en smart-economat-backend (Nest).
   * @undefined {ValidationArguments} args - Entrada efectiva esperada por el contrato.
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  defaultMessage(args: ValidationArguments) {
    return `${args.property} debe ser un número positivo múltiplo de 0.5 (ej: 0.5, 1, 1.5, 2...)`;
  }
}

/**
 * Decorador para validar raciones/porciones (múltiplos de 0.5).
 */
/**
 * Expone "IsPortion" en smart-economat-backend (Nest).
 * @undefined {ValidationOptions | undefined} validationOptions - Entrada efectiva esperada por el contrato.
 * @undefined {(object: object, propertyName: string) => void} Datos efectivos después de ejecutar la operación.
 */
export function IsPortion(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPortionConstraint,
    });
  };
}
