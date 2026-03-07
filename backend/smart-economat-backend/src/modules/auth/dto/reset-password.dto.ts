import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  @IsString()
  token!: string;

  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString()
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
  newPassword!: string;
}
