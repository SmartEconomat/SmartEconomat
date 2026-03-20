import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  permisosAdicionalesIds?: string[];

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  permisosExcluidosIds?: string[];
}
