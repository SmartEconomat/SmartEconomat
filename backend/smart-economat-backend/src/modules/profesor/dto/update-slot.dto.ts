import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateSlotDto {
  @IsString()
  @IsOptional()
  aula?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  numeroClase?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacidad?: number;

  @IsOptional()
  @IsUUID()
  ubicacionId?: string;
}
