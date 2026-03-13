import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePedidoLineDto {
  @ApiProperty({ description: 'ID del Producto Proveedor', format: 'uuid' })
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTOPROVEEDOR_DEBE_SER_UN'
    ),
  })
  productoProveedorId!: string;

  @ApiProperty({ description: 'Cantidad pedida', minimum: 0.001 })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_DEBE_SER_NUM_RICA'
      ),
    }
  )
  @Min(0.001, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_DEBE_SER_MAYOR_QUE_0'
    ),
  })
  cantidad!: number;
}
