import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class AlertaCaducidadDTO {
  @IsUUID('7', { message: 'El ID debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id: string;

  @IsDateString(
    {},
    { message: 'La fecha de caducidad debe ser una fecha válida (ISO 8601)' }
  )
  @IsNotEmpty({ message: 'La fecha de caducidad es obligatoria' })
  fechaCaducidad: string;
}
