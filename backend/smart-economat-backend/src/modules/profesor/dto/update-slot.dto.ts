import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
