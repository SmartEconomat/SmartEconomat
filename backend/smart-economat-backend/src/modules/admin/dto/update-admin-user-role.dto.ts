<<<<<<< HEAD
import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
=======
import { IsNotEmpty, IsUUID } from 'class-validator';
>>>>>>> eb5618a (fix: errores de login/registro y visualizacion de estado activo/inactivo bucle infinito)

export class UpdateAdminUserRoleDto {
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
<<<<<<< HEAD

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  permisosAdicionalesIds?: string[];

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  permisosExcluidosIds?: string[];
=======
>>>>>>> eb5618a (fix: errores de login/registro y visualizacion de estado activo/inactivo bucle infinito)
}
