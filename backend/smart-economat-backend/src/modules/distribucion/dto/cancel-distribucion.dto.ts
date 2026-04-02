import { IsOptional, IsString } from 'class-validator';

export class CancelDistribucionDto {
  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
