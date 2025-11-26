import { IsString, IsOptional, Length } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  contacto?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  telefono?: string;
}
