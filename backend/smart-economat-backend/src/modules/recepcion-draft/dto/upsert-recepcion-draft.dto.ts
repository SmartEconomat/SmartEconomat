import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class UpsertRecepcionDraftDto {
  @ApiProperty({
    description: 'Payload serializable del formulario de recepción en curso.',
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
