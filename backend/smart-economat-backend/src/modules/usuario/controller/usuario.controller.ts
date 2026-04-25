import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { UsuarioService } from '../service/usuario.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { UpdateUsuarioStatusDto } from '../dto/update-status.dto';
import { UpdateUsuarioRolDto } from '../dto/update-rol.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AdminCreateUsuarioDto } from '../dto/admin-create-usuario.dto';
import { AdminUpdateUsuarioDto } from '../dto/admin-update-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { rolUsuario } from '../enums/usuario.enums';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * REST controller that exposes user (Usuario) management endpoints, covering
 * account creation, profile management, password operations, role/status updates,
 * and fine-grained permission adjustments.
 *
 * @class UsuarioController
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
  /**
   * Creates an instance of UsuarioController.
   *
   * @param {UsuarioService} usuarioService - Service layer for user operations.
   */
  constructor(private readonly usuarioService: UsuarioService) {}

  /**
   * Creates a standard user account.
   *
   * @param {CreateUsuarioDto} dto - User creation payload.
   * @returns {Promise<Usuario>} The newly created user.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  /**
   * Creates a user with admin-level data, including role assignment and optional
   * linked Profesor or Alumno profile creation.
   *
   * @param {AdminCreateUsuarioDto} dto - Admin-level user creation payload.
   * @returns {Promise<Usuario>} The newly created user with relations loaded.
   */
  @Post('admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  createAdmin(@Body() dto: AdminCreateUsuarioDto) {
    return this.usuarioService.createAdmin(dto);
  }

  /**
   * Returns the authenticated user's profile together with their resolved
   * effective permission list.
   *
   * @param {string} id - ID of the currently authenticated user (from JWT).
   * @returns {Promise<Usuario & { permisos: string[] }>} User profile with permissions.
   */
  @Get('perfil')
  async getPerfil(@GetUser('id') id: string) {
    const usuario = await this.usuarioService.findOne(id);
    const permisos = await this.usuarioService.getUserPermissions(id);
    return {
      ...usuario,
      permisos,
    };
  }

  /**
   * Allows the authenticated user to update their own profile fields.
   *
   * @param {string} id - ID of the currently authenticated user (from JWT).
   * @param {UpdateUsuarioDto} dto - Fields to update.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch('perfil')
  updatePerfil(@GetUser('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
  }

  /**
   * Allows the authenticated user to change their own password by providing
   * the current password for verification.
   *
   * @param {string} id - ID of the currently authenticated user (from JWT).
   * @param {ChangePasswordDto} dto - Old and new password payload.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch('perfil/password')
  changePassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usuarioService.changePassword(id, dto);
  }

  /**
   * Returns a paginated list of all users. Admin users see soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination, sort, and search parameters.
   * @param {string} userRole - Role of the requesting user (from JWT).
   * @returns {Promise<PaginatedResponseDto<Usuario>>} Paginated user list.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  findAll(
    @SortableFields([
      'username',
      'email',
      'rol',
      'status',
      'activo',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @GetUser('rol') userRole: string
  ) {
    return this.usuarioService.findAll(query, userRole);
  }

  /**
   * Returns a minimal user list suitable for dropdowns and autocomplete widgets.
   *
   * @returns {Promise<Partial<Usuario>[]>} Array of minimal user objects.
   */
  @Get('minimos')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  findAllMinimal() {
    return this.usuarioService.findAllMinimal();
  }

  /**
   * Retrieves a single user by UUID.
   *
   * @param {string} id - UUID of the user.
   * @returns {Promise<Usuario>} The found user entity.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.usuarios.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

  /**
   * Updates a user's own editable profile fields.
   *
   * @param {string} id - UUID of the user to update.
   * @param {UpdateUsuarioDto} dto - Fields to update.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /**
   * Admin-only update of a user's account data (role, status, etc.).
   *
   * @param {string} id - UUID of the user to update.
   * @param {AdminUpdateUsuarioDto} dto - Admin-level update payload.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch(':id/admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUsuarioDto
  ) {
    return this.usuarioService.updateAdmin(id, dto);
  }

  /**
   * Updates the active/inactive status of a user account.
   *
   * @param {string} id - UUID of the user.
   * @param {UpdateUsuarioStatusDto} dto - Status update payload.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch(':id/activar')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioStatusDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /**
   * Updates the role assigned to a user.
   *
   * @param {string} id - UUID of the user.
   * @param {UpdateUsuarioRolDto} dto - Role update payload.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch(':id/rol')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  updateRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioRolDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /**
   * Admin-initiated password reset for a user account. Forces the user to
   * change their password on next login.
   *
   * @param {string} id - UUID of the user.
   * @param {ResetPasswordDto} dto - New password payload.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Patch(':id/password')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto
  ) {
    return this.usuarioService.resetPassword(id, dto);
  }

  /**
   * Soft-deletes a user account.
   *
   * @param {string} id - UUID of the user to delete.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.usuarios.eliminar)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

  /**
   * Grants an additional permission to a user outside their role's default set.
   *
   * @param {string} id - UUID of the user.
   * @param {string} permisoId - UUID of the permission to grant.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Post(':id/permisos-adicionales/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  addAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addAdditionalPermission(id, permisoId);
  }

  /**
   * Revokes a previously granted additional permission from a user.
   *
   * @param {string} id - UUID of the user.
   * @param {string} permisoId - UUID of the permission to revoke.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Delete(':id/permisos-adicionales/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  removeAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeAdditionalPermission(id, permisoId);
  }

  /**
   * Adds a permission to the user's exclusion list, preventing it from being
   * active even if their role grants it.
   *
   * @param {string} id - UUID of the user.
   * @param {string} permisoId - UUID of the permission to exclude.
   * @returns {Promise<Usuario>} The updated user entity.
   */
  @Post(':id/permisos-excluidos/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  addExcludedPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addExcludedPermission(id, permisoId);
  }

  /**
   * Removes a permission from the user's exclusion list, restoring the
   * default role-based grant if applicable.
   *
   * @param {string} id - UUID of the user.
   * @param {string} permisoId - UUID of the permission to remove from exclusions.
   * @returns {Promise<{ success: boolean }>} Simple success indicator.
   */
  @Delete(':id/permisos-excluidos/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  removeExcludedPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeExcludedPermission(id, permisoId);
  }
}
