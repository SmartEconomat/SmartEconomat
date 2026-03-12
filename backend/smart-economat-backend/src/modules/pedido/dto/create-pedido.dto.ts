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
  ArrayNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoLineDto } from './create-pedido-line.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID del usuario que crea el pedido',
    required: false,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  idUsuario?: string;

  @ApiProperty({
    description: 'ID del proveedor',
    required: true,
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  proveedorId!: string;

  @ApiProperty({
    description: 'Coste total estimado del pedido',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  costeTotal?: number;

  @ApiProperty({
    description: 'Estado inicial del pedido',
    required: false,
    enum: EstadoPedido,
  })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @ApiProperty({
    description: 'Fecha esperada de entrega',
    required: true,
  })
  @IsNotEmpty({ message: 'La fecha de entrega es requerida' })
  @Transform((params) => StringToDateTransformer.transform(params))
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_ENTREGA_DEBE_SER_UNA_FECHA_V'
      ),
    }
  )
  fechaEntrega!: Date;

  @ApiProperty({
    description: 'Motivo de cancelación (si aplica)',
    required: false,
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  motivoCancelacion?: string;

  @ApiProperty({
    description: 'Líneas de detalle del pedido',
    type: [CreatePedidoLineDto],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'El pedido debe contener al menos una línea' })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoLineDto)
  lineas!: CreatePedidoLineDto[];
}
