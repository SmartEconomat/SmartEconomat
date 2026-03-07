import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual es obligatoria' })
  @IsNotEmpty()
  oldPassword!: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @IsNotEmpty()
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
        'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    }
  )
  newPassword!: string;
}
