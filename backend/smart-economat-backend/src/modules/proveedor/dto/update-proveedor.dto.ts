import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';
import { CreateProveedorDto } from './create-proveedor.dto';

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  nombre?: string;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  contacto?: string;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  telefono?: string;

  @Transform(function (this: void, params) {
    return LowercaseStringTransformer.transform(params);
  })
  email?: string;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  direccion?: string;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  nif?: string;
}
