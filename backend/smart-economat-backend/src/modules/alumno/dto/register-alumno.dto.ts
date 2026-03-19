import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class RegisterAlumnoDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : ''
  )
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

  @ValidateIf(
    (object: RegisterAlumnoDto) =>
      !object.aula && !object.numeroClase && !object.cialProfesor
  )
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : ''
  )
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : ''
  )
  @IsString()
  @IsNotEmpty()
  codigoClase!: string;

  @ValidateIf((object: RegisterAlumnoDto) => !object.codigoClase)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : ''
  )
  @IsString()
  @IsNotEmpty()
  aula?: string;

  @ValidateIf((object: RegisterAlumnoDto) => !object.codigoClase)
  @Type(() => Number)
  @Transform(({ value }): number | string =>
    value === '' || value === null || value === undefined ? '' : Number(value)
  )
  @IsInt()
  @Min(1)
  numeroClase?: number;

  @ValidateIf((object: RegisterAlumnoDto) => !object.codigoClase)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toUpperCase() : ''
  )
  @IsString()
  @IsNotEmpty()
  cialProfesor?: string;
}
