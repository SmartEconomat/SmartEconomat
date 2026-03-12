import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsInt,
  IsNotEmpty,
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
      message: i18nValidationMessage(
        'validation.LA_CONTRASE_A_DEBE_TENER_AL_MENOS_8_CARA'
      ),
    }
  )
  password!: string;

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
