import { i18nValidationMessage } from 'nestjs-i18n';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUnique } from '../../../common/decorators/is-unique.decorator';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';

export class CreateUbicacionDto {
  @ApiProperty({
    description: 'docs.NOMBRE_DE_LA_UBICACI_N',
    example: 'Almacen A',
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
}
