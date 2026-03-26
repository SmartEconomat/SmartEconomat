import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate(value: unknown, args: ValidationArguments) {
    const [entityClass, field] = args.constraints as [new () => object, string];
    const repository = this.dataSource.getRepository(entityClass);
    const exists = await repository.findOne({
      where: { [field || args.property]: value } as Record<string, unknown>,
    });
    return !exists;
  }

  defaultMessage(args: ValidationArguments) {
    const [entityClass] = args.constraints;
    return `${entityClass.name} with this ${args.property} already exists`;
  }
}

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
