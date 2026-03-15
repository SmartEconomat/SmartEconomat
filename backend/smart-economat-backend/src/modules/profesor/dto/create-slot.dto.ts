import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSlotDto {
  @IsString()
  @IsNotEmpty()
  aula!: string;

  @IsInt()
  @Min(1)
  numeroClase!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidad?: number;
}
