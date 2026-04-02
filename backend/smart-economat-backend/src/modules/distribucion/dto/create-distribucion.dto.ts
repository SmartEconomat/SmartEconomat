import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDistribucionLineaDto {
  @IsUUID()
  pedidoUsuarioLineaId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateDistribucionDto {
  @IsUUID()
  pedidoUsuarioId!: string;

  @IsOptional()
  @IsUUID()
  ubicacionOrigenId?: string;

  @IsOptional()
  @IsUUID()
  ubicacionDestinoId?: string;

  @IsOptional()
  @IsUUID()
  alumnoSlotId?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDistribucionLineaDto)
  lineas!: CreateDistribucionLineaDto[];
}
