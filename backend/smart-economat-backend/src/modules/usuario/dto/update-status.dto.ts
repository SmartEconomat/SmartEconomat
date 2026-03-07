import { IsEnum } from 'class-validator';
import { UserStatus } from '../enums/usuario.enums';

export class UpdateUsuarioStatusDto {
  @IsEnum(UserStatus, { message: 'El estado no es válido' })
  status!: UserStatus;
}
