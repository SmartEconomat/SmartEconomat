import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class AlertaCaducidadDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_caducidad: string;
}
