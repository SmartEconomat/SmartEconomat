import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminService } from '../service/admin.service';
import { CreateProfesorDto } from '../../profesor/dto/create-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { UpdateAdminUserRoleDto } from '../dto/update-admin-user-role.dto';
import { UpdateAdminUserActivationDto } from '../dto/update-admin-user-activation.dto';
import { RolesGuard } from '../../auth/guards/role.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Documentación en español.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
export class AdminController {
        /**
     * Documentación en español.
     */
  constructor(private readonly adminService: AdminService) {}

        /**
     * Documentación en español.
     */
  @Get('roles')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getRoles() {
    return this.adminService.getRoles();
  }

        /**
     * Documentación en español.
     */
  @Get('permissions')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getPermissions() {
    return this.adminService.getPermissions();
  }

        /**
     * Documentación en español.
     */
  @Post('profesores')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

        /**
     * Documentación en español.
     */
  @Patch('users/:id/role')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  async updateUserRole(
    @GetUser('id') actorUserId: string,
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserRoleDto
  ) {
    return this.adminService.updateUserRole(
      actorUserId,
      userId,
      dto.roleId,
      dto.permisosAdicionalesIds,
      dto.permisosExcluidosIds
    );
  }

        /**
     * Documentación en español.
     */
  @Patch('users/:id/activate')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.activar_desactivar)
  async activateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserActivationDto
  ) {
    return this.adminService.activateUser(userId, dto.active);
  }

        /**
     * Documentación en español.
     */
  @Post('users/:id/force-reset')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.resetear_password)
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
