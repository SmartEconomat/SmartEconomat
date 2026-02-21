import {
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateRecepcionDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de recepción debe ser una fecha válida (ISO 8601)' }
  )
  fechaRecepcion?: Date;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  @MaxLength(1000, {
    message: 'Las observaciones no pueden exceder los 1000 caracteres',
  })
  observaciones?: string;

  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsUUID('7', { message: 'El ID del usuario debe ser un UUID válido' })
  usuarioId: string;
}
