import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';
import { CreateProveedorDto } from './create-proveedor.dto';

/** Clase pública (UpdateProveedorDto). Paquete: smart-economat-backend (Nest). */
export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @Transform((params) => TrimStringTransformer.transform(params))
  nombre?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  contacto?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  telefono?: string;

  @Transform((params) => LowercaseStringTransformer.transform(params))
  email?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  direccion?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  nif?: string;
}
