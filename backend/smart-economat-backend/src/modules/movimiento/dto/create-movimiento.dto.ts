import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento, {
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO'
    ),
  })
  tipo!: TipoMovimiento;

  @IsInt({
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO'
    ),
  })
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidad!: number;

  @Transform(TrimStringTransformer.transform)
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D'
    ),
  })
  entidadTipo!: string;

  @Transform(TrimStringTransformer.transform)
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE'
    ),
  })
  entidadId!: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
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

  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V'
    ),
  })
  @IsOptional()
  inventario?: string;

  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  @IsOptional()
  usuario?: string;
}
