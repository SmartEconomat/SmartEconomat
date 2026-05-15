import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/** Clase pública (ProductPriceHistoryQueryDto). Paquete: smart-economat-backend (Nest). */
export class ProductPriceHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'UUID v7 del proveedor para filtrar historial de precios.',
    example: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UNA_CADENA'
    ),
  })
  proveedorId?: string;
}
