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
 * Controller that exposes administrative endpoints for managing users, roles,
 * permissions, and professor accounts.
 * All routes require JWT authentication, role-based access, and specific permissions.
 *
 * @class AdminController
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
export class AdminController {
  /**
   * Constructs the AdminController with its required service dependency.
   *
   * @param {AdminService} adminService - Service that handles admin business logic.
   */
  constructor(private readonly adminService: AdminService) {}

  /**
   * Retrieves all active roles with their associated permissions.
   *
   * @returns {Promise<Rol[]>} List of active roles ordered alphabetically.
   */
  @Get('roles')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getRoles() {
    return this.adminService.getRoles();
  }

  /**
   * Retrieves all active permissions ordered by module and name.
   *
   * @returns {Promise<Permiso[]>} List of active permissions.
   */
  @Get('permissions')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  /**
   * Creates a new professor user account with an associated professor profile.
   *
   * @param {CreateProfesorDto} dto - Data transfer object with professor registration details.
   * @returns {Promise<{ id: string; user_id: string; username: string; cial: string; status: UserStatus }>} The created professor summary.
   * @throws {ConflictException} When username, email, or CIAL already exist.
   */
  @Post('profesores')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

  /**
   * Updates the role of a specific user, optionally adjusting additional and excluded permissions.
   * The calling user's ID is extracted from the JWT to enforce role hierarchy rules.
   *
   * @param {string} actorUserId - The ID of the authenticated administrator (from JWT).
   * @param {string} userId - The ID of the target user (from route param).
   * @param {UpdateAdminUserRoleDto} dto - DTO containing the new role ID and optional permission overrides.
   * @returns {Promise<Usuario | null>} The updated user with roles and permissions.
   * @throws {NotFoundException} When the user or role is not found.
   * @throws {BadRequestException} When the actor lacks sufficient privileges.
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
   * Activates or deactivates a user account.
   *
   * @param {string} userId - The ID of the user to activate or deactivate (from route param).
   * @param {UpdateAdminUserActivationDto} dto - DTO with optional explicit activation state.
   * @returns {Promise<{ message: string; id: string; status: UserStatus; activo: boolean }>} Updated activation status.
   * @throws {NotFoundException} When the user is not found.
   * @throws {BadRequestException} When the change would remove the last active admin.
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
   * Forces a password reset for a user, generating a provisional password
   * and requiring the user to change it on next login.
   *
   * @param {string} userId - The ID of the user whose password will be reset (from route param).
   * @returns {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean }>} The provisional password and reset confirmation.
   * @throws {NotFoundException} When the user is not found.
   */
  @Post('users/:id/force-reset')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.resetear_password)
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
