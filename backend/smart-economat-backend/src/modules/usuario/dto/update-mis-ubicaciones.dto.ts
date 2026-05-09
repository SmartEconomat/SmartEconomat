import { i18nValidationMessage } from 'nestjs-i18n';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

/**
 * Autoservicio: vínculos usuario↔ubicaciones (misma ubicación puede compartirse entre usuarios).
 */
export class UpdateMisUbicacionesDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO'),
  })
  ubicacionesIds!: string[];

  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO'),
  })
  ubicacionPredeterminadaId?: string | null;
}
