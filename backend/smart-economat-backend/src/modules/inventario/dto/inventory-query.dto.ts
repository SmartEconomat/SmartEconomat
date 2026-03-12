import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class InventoryQueryDto {
  @IsOptional()
  @IsUUID('7', { message: 'El productoId debe ser un UUID v7 válido' })
  productoId?: string;

  @IsOptional()
  @IsUUID('7', { message: 'El ubicacionId debe ser un UUID v7 válido' })
  ubicacionId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'onlyLowStock debe ser un valor booleano' })
  onlyLowStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'consolidado debe ser un valor booleano' })
  consolidado?: boolean;
}
