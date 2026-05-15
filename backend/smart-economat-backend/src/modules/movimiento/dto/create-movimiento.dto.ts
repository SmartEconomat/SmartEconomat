import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoMovimiento, AccionMovimiento } from '../enums/movimiento.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/** Clase pública (CreateMovimientoDto). Paquete: smart-economat-backend (Nest). */
export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento, {
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO'
    ),
  })
  @IsOptional()
  tipo?: TipoMovimiento = TipoMovimiento.AUDITORIA;

  @IsEnum(AccionMovimiento, {
    message: i18nValidationMessage(
      'validation.LA_ACCI_N_DE_MOVIMIENTO_NO_ES_V_LIDA'
    ),
  })
  @IsOptional()
  accion?: AccionMovimiento;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  @IsOptional()
  cantidad?: number;

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D'
    ),
  })
  entidadTipo!: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE'
    ),
  })
  entidadId!: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE'
    ),
  })
  @MaxLength(1000, {
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000'
    ),
  })
  descripcion?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V'
    ),
  })
  @IsOptional()
  inventario?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsOptional()
  productoProveedor?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsOptional()
  ubicacionOrigen?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsOptional()
  ubicacionDestino?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsOptional()
  transferencia?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsOptional()
  @MaxLength(128)
  idempotenciaKey?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  @IsOptional()
  usuario?: string;

  @IsObject({
    message: i18nValidationMessage(
      'validation.LOS_DATOS_ANTES_DEBEN_SER_UN_OBJETO'
    ),
  })
  @IsOptional()
  datosAntes?: Record<string, unknown>;

  @IsObject({
    message: i18nValidationMessage(
      'validation.LOS_DATOS_DESPUES_DEBEN_SER_UN_OBJETO'
    ),
  })
  @IsOptional()
  datosDespues?: Record<string, unknown>;
}
