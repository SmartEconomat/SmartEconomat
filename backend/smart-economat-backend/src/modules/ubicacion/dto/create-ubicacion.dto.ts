import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUnique } from '../../../common/decorators/is-unique.decorator';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { TipoUbicacion } from '../enums/tipo-ubicacion.enum';

/** Clase pública (CreateUbicacionDto). Paquete: smart-economat-backend (Nest). */
export class CreateUbicacionDto {
  @ApiProperty({
    description: 'docs.NOMBRE_DE_LA_UBICACI_N',
    example: 'Cocina principal',
  })
  @IsUnique(Ubicacion, 'nombre', {
    message: i18nValidationMessage('validation.LOCATION_NAME_ALREADY_EXISTS'),
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'docs.DESCRIPCI_N_DETALLADA',
    example: 'A la vuelta de la esquina',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE'
    ),
  })
  @MaxLength(255, {
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_NO_PUEDE_SUPERAR_LOS_255'
    ),
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description:
      'Código corto estable (slug). Si se omite, se deriva del nombre.',
    example: 'cocina_principal',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(64)
  codigo?: string;

  @ApiPropertyOptional({
    enum: TipoUbicacion,
    default: TipoUbicacion.ALMACEN_GENERAL,
  })
  @IsOptional()
  @IsEnum(TipoUbicacion)
  tipo?: TipoUbicacion;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  esVirtual?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiPropertyOptional({
    description: 'Ubicación padre en jerarquía (opcional)',
  })
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Tenant / centro (opcional)' })
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  organizacionId?: string | null;

  @ApiPropertyOptional({
    description: 'Metadatos libres por integración ERP / automatización',
  })
  @IsOptional()
  @IsObject()
  metadata?: object | null;
}
