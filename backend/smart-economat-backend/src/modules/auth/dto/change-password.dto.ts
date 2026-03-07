import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString()
  currentPassword!: string;

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
        'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    }
  )
  newPassword!: string;
}
