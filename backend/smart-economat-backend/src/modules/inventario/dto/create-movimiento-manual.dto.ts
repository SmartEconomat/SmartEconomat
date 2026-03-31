import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  NotEquals,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimientoManual } from '../../movimiento/enums/movimiento.enums';

export class CreateMovimientoManualDto {
  @ApiProperty({
    description: 'UUID v7 del registro de inventario a ajustar',
  })
  @IsUUID('all')
  @IsNotEmpty()
  inventarioId!: string;

  @ApiProperty({
    enum: TipoMovimientoManual,
    description: 'Tipo de movimiento manual a registrar en auditoría',
  })
  @IsEnum(TipoMovimientoManual)
  tipo!: TipoMovimientoManual;

  @ApiProperty({
    description:
      'Delta aplicado al stock. Positivo incrementa stock y negativo descuenta stock',
    example: -3,
  })
  @Type(() => Number)
  @IsNumber()
  @NotEquals(0)
  ajuste!: number;

  @ApiProperty({
    description: 'Motivo del ajuste manual para auditoría',
    maxLength: 150,
    example: 'Rotura interna',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  motivo!: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales del ajuste manual',
    maxLength: 500,
    example: 'Se detectó envase dañado durante la revisión del turno',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
