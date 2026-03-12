import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';
import { CreateProveedorDto } from './create-proveedor.dto';

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @Transform(TrimStringTransformer.transform)
  nombre?: string;

  @Transform(TrimStringTransformer.transform)
  contacto?: string;

  @Transform(TrimStringTransformer.transform)
  telefono?: string;

  @Transform(LowercaseStringTransformer.transform)
  email?: string;

  @Transform(TrimStringTransformer.transform)
  direccion?: string;

  @Transform(TrimStringTransformer.transform)
  nif?: string;
}
