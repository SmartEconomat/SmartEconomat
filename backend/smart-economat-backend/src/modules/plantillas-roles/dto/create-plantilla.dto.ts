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
    description: 'docs.NOMBRE_NICO_DE_LA_PLANTILLA',
    example: 'ADMIN',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ description: 'docs.DESCRIPCI_N_DE_LA_PLANTILLA' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_LA_PLANTILLA_ES_EDITABLE',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  esEditable?: boolean;

  @ApiPropertyOptional({
    description: 'docs.ID_DE_LA_PLANTILLA_PADRE_HERENCIA',
  })
  @IsUUID('7')
  @IsOptional()
  plantillaPadreId?: string;

  @ApiPropertyOptional({ description: 'docs.IDS_DE_PERMISOS_DE_LA_PLANTILLA' })
  @IsArray()
  @IsUUID('7', { each: true })
  @IsOptional()
  permisoIds?: string[];
}
