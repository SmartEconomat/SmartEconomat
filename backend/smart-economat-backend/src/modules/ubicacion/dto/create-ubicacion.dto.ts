import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUbicacionDto {
  @ApiProperty({ description: 'Nombre de la ubicación', example: 'Almacen A' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar los 150 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: 'A la vuelta de la esquina',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, {
    message: 'La descripción no puede superar los 255 caracteres',
  })
  descripcion?: string;
}
