import { IsOptional, IsUUID } from 'class-validator';
import { UpdateSlotDto } from './update-slot.dto';

export class AdminUpdateSlotDto extends UpdateSlotDto {
  @IsOptional()
  @IsUUID()
  profesorId?: string;
}
