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
 * Controlador REST para admin.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
export class AdminController {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly adminService Parámetro de entrada para la operación.
   */
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtiene roles.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('roles')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getRoles() {
    return this.adminService.getRoles();
  }

  /**
   * Obtiene permissions.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('permissions')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateProfesorDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; user_id: string; username: string; cial: string; status: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('profesores')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} actorUserId - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateAdminUserRoleDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity").Usuario | null>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "activateUser" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateAdminUserActivationDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; id: string; status: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus.INACTIVE | import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus.ACTIVE; activo: boolean; }>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "forcePasswordReset" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('users/:id/force-reset')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.resetear_password)
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
