import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

export class RegisterAlumnoDto {
  @Transform(TrimStringTransformer.transform)
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

  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  aula!: string;

  @Type(() => Number)
  @Transform(StringToNumberTransformer.transform)
  @IsInt()
  @Min(1)
  numeroClase!: number;

  @Transform(TrimStringTransformer.transform)
  @IsString()
  @IsNotEmpty()
  cialProfesor!: string;
}
