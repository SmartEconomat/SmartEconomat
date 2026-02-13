import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}
