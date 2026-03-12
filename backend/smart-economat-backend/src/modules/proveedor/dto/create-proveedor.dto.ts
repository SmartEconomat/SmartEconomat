import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class CreateProveedorDto {
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @MaxLength(100)
  contacto?: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @Transform(LowercaseStringTransformer.transform)
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
  @IsString()
  direccion?: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
  @IsString()
  @MaxLength(20)
  nif?: string;
}
