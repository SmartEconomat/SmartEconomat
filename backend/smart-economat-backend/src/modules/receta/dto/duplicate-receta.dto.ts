import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DuplicateRecetaDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the source recipe to duplicate',
  })
  @IsUUID('7')
  sourceId!: string;

  @ApiProperty({
    example: 'Paella Vegana',
    description: 'Name for the new duplicated recipe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  newName!: string;
}
