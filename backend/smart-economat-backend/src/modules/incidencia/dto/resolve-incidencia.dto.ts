import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoResolucion } from '../enums/incidencia.enums';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Clase pública (ResolveIncidenciaDto). Paquete: smart-economat-backend (Nest). */
export class ResolveIncidenciaDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsEnum(TipoResolucion, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  accion: TipoResolucion;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.MUST_BE_STRING') })
  observaciones?: string;
}
