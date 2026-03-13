import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DuplicateRecetaDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'docs.ID_OF_THE_SOURCE_RECIPE_TO_DUPLICATE',
  })
  @IsUUID('7')
  sourceId!: string;

  @ApiProperty({
    example: 'Paella Vegana',
    description: 'docs.NAME_FOR_THE_NEW_DUPLICATED_RECIPE',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  newName!: string;
}
