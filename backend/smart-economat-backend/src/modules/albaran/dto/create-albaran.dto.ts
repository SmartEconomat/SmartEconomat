import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateAlbaranDto {
  @IsString()
  @IsNotEmpty()
  nAlbaran: string;

  @IsOptional()
  @IsBoolean()
  concordancia?: boolean;

  @IsOptional()
  fecha?: Date;
}
