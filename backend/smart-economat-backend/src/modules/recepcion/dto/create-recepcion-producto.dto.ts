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
/** Clase pública (NotDraftConstraint). Paquete: smart-economat-backend (Nest). */
@ValidatorConstraint({ name: 'notDraft', async: false })
export class NotDraftConstraint implements ValidatorConstraintInterface {
  /**
   * Expone "validate" en smart-economat-backend (Nest).
   * @undefined {any} value - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  validate(value: any) {
    return typeof value === 'string' ? value !== 'draft' : true;
  }
  /**
   * Expone "defaultMessage" en smart-economat-backend (Nest).
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  defaultMessage() {
    return `El valor 'draft' no es válido para este campo.`;
  }
}
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';

/** Clase pública (CreateRecepcionProductoDto). Paquete: smart-economat-backend (Nest). */
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidadAlbaran?: number;
}
