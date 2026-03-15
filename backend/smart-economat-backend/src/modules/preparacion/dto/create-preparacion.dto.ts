import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreatePreparacionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @Min(1)
  tiempoEstimadoMinutos: number;

  @IsNumber()
  @Min(0)
  costeEstimado: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ingredientes: string[];
}
