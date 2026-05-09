import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateSlotDto } from './create-slot.dto';

/** Clase pública (AdminCreateSlotDto). Paquete: smart-economat-backend (Nest). */
export class AdminCreateSlotDto extends CreateSlotDto {
  @IsUUID()
  @IsNotEmpty()
  profesorId!: string;
}
