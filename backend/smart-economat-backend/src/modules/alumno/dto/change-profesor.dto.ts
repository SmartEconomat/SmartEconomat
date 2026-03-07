import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ChangeProfesorDto {
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
