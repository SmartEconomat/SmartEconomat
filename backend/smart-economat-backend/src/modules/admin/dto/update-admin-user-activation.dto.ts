import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminUserActivationDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
