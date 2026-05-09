import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Min } from 'class-validator';

/** Clase pública (UpsertPedidoDraftDto). Paquete: smart-economat-backend (Nest). */
export class UpsertPedidoDraftDto {
  @ApiProperty({
    description:
      'Payload serializable del formulario de creación de pedido en curso.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Versión conocida por el cliente para control de concurrencia optimista.',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
