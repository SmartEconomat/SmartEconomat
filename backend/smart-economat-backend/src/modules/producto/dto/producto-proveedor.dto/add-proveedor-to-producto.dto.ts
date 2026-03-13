import { i18nValidationMessage } from 'nestjs-i18n';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class AddProveedorToProductoDto {
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UNA_CADENA'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_ES_OBLIGATORIO'
    ),
  })
  proveedorId: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO'
    ),
  })
  marcaEspecifica?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA'
    ),
  })
  codigoBarras?: string;

  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_PRECIO_UNITARIO_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  precioUnitario?: number;
}
