import { IsString, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateAlbaranDto {
  @IsString()
  nAlbaran: string;

  @IsBoolean()
  @IsOptional()
  concordancia?: boolean;

  @IsDateString()
  @IsOptional()
  fecha?: Date;
}
