import { i18nValidationMessage } from 'nestjs-i18n';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class InventoryQueryDto {
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.PRODUCTO_ID_UUIDV7_INVALIDO'),
  })
  productoId?: string;

  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO'),
  })
  ubicacionId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({
    message: i18nValidationMessage('validation.ONLYLOWSTOCK_BOOLEAN'),
  })
  onlyLowStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({
    message: i18nValidationMessage('validation.CONSOLIDADO_BOOLEAN'),
  })
  consolidado?: boolean;
}
