import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoProductoDto } from './pedido-producto.dto';
import { CreatePedidoProductoDto } from './create-PedidoProducto.dto';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class CreatePedidoDto {
  @IsOptional()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  idUsuario?: string;

  @IsNotEmpty()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  proveedorId!: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(StringToNumberTransformer.transform)
  @IsNumber()
  costeTotal?: number;

  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @Transform(StringToDateTransformer.transform)
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_ENTREGA_DEBE_SER_UNA_FECHA_V'
      ),
    }
  )
  fechaEntrega?: string;

  @IsOptional()
  @Transform(TrimStringTransformer.transform)
  @IsString()
  motivoCancelacion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoProductoDto)
  pedidoProductos?: PedidoProductoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoProductoDto)
  productos?: CreatePedidoProductoDto[];
}
