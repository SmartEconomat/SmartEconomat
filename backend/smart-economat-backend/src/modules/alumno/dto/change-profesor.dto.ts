import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangeProfesorDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  cialNuevoProfesor!: string;

  @IsString()
  @IsNotEmpty()
  nuevaAula!: string;

  @IsInt()
  @Min(1)
  nuevoNumeroClase!: number;
}
