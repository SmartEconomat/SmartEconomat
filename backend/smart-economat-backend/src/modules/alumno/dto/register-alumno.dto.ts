import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Min,
} from 'class-validator';

export class RegisterAlumnoDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

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
  password!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  aula!: string;

  @IsInt()
  @Min(1)
  numeroClase!: number;

  @IsString()
  @IsNotEmpty()
  cialProfesor!: string;
}
