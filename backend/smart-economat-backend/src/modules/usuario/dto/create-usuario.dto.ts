import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { rolUsuario } from '../enums/usuario.enums';

export class CreateUsuarioDto {
  @IsString()
  @Length(1, 100)
  nombre!: string;

  @IsString()
  @Length(1, 100)
  username!: string;

  @IsString()
  @Length(6, 255)
  password!: string;

  @IsEnum(rolUsuario)
  rol!: rolUsuario;

  @IsEmail()
  @Length(1, 150)
  email!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
