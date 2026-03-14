import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecepcionDraftResponseDto {
  @ApiPropertyOptional({
    description: 'ID persistido del borrador en PostgreSQL si existe.',
    example: '0195caaa-9f0b-7a10-bf67-b7f30cba3a7d',
  })
  id?: string;

  @ApiProperty({
    description: 'Versión del borrador para optimistic locking.',
    example: 5,
  })
  version!: number;

  @ApiProperty({
    description: 'Origen de la lectura o última escritura visible.',
    enum: ['redis', 'database'],
  })
  source!: 'redis' | 'database';

  @ApiProperty({
    description: 'Fecha de creación lógica del borrador.',
    example: '2026-03-14T10:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Fecha de última modificación del borrador.',
    example: '2026-03-14T10:05:00.000Z',
  })
  updatedAt!: string;

  @ApiPropertyOptional({
    description: 'Fecha de expiración del borrador si aplica.',
    example: '2026-03-21T10:05:00.000Z',
    nullable: true,
  })
  expiresAt!: string | null;

  @ApiProperty({
    description: 'Payload serializable del formulario de recepción.',
    type: 'object',
    additionalProperties: true,
  })
  payload!: Record<string, unknown>;
}
