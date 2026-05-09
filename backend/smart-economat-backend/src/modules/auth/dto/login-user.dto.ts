import { IsNotEmpty, IsString } from 'class-validator';

/** Clase pública (LoginUserDto). Paquete: smart-economat-backend (Nest). */
export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
