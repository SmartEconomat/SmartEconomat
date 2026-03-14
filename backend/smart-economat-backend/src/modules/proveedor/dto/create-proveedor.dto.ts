import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class CreateProveedorDto {
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(100)
  contacto?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @Transform((params) => LowercaseStringTransformer.transform(params))
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  direccion?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(20)
  nif?: string;
}
