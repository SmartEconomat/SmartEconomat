import {
  IsUUID,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class AlertaCaducidad {

@IsUUID()
@IsNotEmpty()
id: string;

@IsDateString()
@IsNotEmpty()
fecha_caducidad: string
}