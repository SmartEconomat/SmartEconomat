import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateSlotDto {
  @IsString()
  @IsNotEmpty()
  aula!: string;

  @IsInt()
  @Min(1)
  numeroClase!: number;

  @IsInt()
  @Min(1)
  capacidad!: number;
}
