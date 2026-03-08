import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlantillaDto {
  @ApiProperty({
    description: 'Nombre único de la plantilla',
    example: 'GESTOR',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción de la plantilla' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Indica si la plantilla es editable',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  esEditable?: boolean;

  @ApiPropertyOptional({ description: 'ID de la plantilla padre (herencia)' })
  @IsUUID('7')
  @IsOptional()
  plantillaPadreId?: string;

  @ApiPropertyOptional({ description: 'IDs de permisos de la plantilla' })
  @IsArray()
  @IsUUID('7', { each: true })
  @IsOptional()
  permisoIds?: string[];
}
