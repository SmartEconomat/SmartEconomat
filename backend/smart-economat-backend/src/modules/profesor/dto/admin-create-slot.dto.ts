import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateSlotDto } from './create-slot.dto';

export class AdminCreateSlotDto extends CreateSlotDto {
  @IsUUID()
  @IsNotEmpty()
  profesorId!: string;
}
