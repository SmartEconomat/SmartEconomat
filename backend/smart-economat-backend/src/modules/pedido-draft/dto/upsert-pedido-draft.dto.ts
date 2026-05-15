import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/** Límite de 64 KB para el JSON serializado del payload del borrador. */
const MAX_PAYLOAD_JSON_BYTES = 64 * 1024;

/** Clase pública (UpsertPedidoDraftDto). Paquete: smart-economat-backend (Nest). */
export class UpsertPedidoDraftDto {
  @ApiProperty({
    description:
      'Payload serializable del formulario de creación de pedido en curso. Máximo 64 KB serializado.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @Transform(({ value }: { value: unknown }) => {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_PAYLOAD_JSON_BYTES) {
      throw new BadRequestException(
        `El payload del borrador supera el límite de ${MAX_PAYLOAD_JSON_BYTES / 1024} KB`
      );
    }
    return value as Record<string, unknown>;
  })
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
