import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
@ValidatorConstraint({ name: 'notDraft', async: false })
export class NotDraftConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return typeof value === 'string' ? value !== 'draft' : true;
  }
  defaultMessage() {
    return `El valor 'draft' no es válido para este campo.`;
  }
}
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';

export class CreateRecepcionProductoDto {
  @IsNotEmpty()
  @IsUUID('all')
  @Validate(NotDraftConstraint)
  idRecepcion!: string;

  @IsNotEmpty()
  @IsUUID('all')
  @Validate(NotDraftConstraint)
  idPedidoProducto!: string;

  @IsNumber()
  @Min(0)
  cantidadRecibida!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsEnum(EstadoProductoRecepcion)
  estadoProducto?: EstadoProductoRecepcion;

  @IsOptional()
  @IsDateString()
  fechaRecepcion?: string;
}
