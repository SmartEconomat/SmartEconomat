import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
