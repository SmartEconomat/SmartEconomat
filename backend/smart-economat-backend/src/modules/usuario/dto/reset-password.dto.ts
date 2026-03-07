import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
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
}
