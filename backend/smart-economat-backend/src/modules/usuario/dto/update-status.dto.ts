import { IsBoolean } from 'class-validator';

export class UpdateUsuarioStatusDto {
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  activo!: boolean;
}
