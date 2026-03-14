import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { rolUsuario } from '../enums/usuario.enums';

export class AdminCreateUsuarioDto {
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @MaxLength(150, {
    message: 'El nombre completo no puede exceder los 150 caracteres',
  })
  nombre!: string;

  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MaxLength(100, {
    message: 'El nombre de usuario no puede exceder los 100 caracteres',
  })
  username!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    }
  )
  password!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255, {
    message: 'El correo electrónico no puede exceder los 255 caracteres',
  })
  email?: string | null;

  @IsEnum(rolUsuario, { message: 'El rol de usuario no es válido' })
  rol!: rolUsuario;

  @IsOptional()
  @IsString({ message: 'El aula/clase debe ser una cadena de texto' })
  aula?: string;

  @IsOptional()
  @IsString({ message: 'El CIAL debe ser una cadena de texto' })
  cial?: string;
}
