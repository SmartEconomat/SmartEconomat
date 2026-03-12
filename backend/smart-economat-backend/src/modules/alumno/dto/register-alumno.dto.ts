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
  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
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

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  @IsString()
  @IsNotEmpty()
  aula!: string;

  @Type(() => Number)
  @Transform(function (this: void, params) {
    return StringToNumberTransformer.transform(params);
  })
  @IsInt()
  @Min(1)
  numeroClase!: number;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  @IsString()
  @IsNotEmpty()
  cialProfesor!: string;
}
