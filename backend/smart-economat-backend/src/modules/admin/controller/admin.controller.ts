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
 * Controlador que expone los endpoints administrativos para gestionar usuarios, roles,
 * permisos y cuentas de profesores.
 * Todas las rutas requieren autenticación JWT, acceso basado en roles y permisos específicos.
 *
 * @class AdminController
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
export class AdminController {
  /**
   * Construye el AdminController con su dependencia de servicio requerida.
   *
   * @param {AdminService} adminService - Servicio que gestiona la lógica de negocio administrativa.
   */
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtiene todos los roles activos con sus permisos asociados.
   *
   * @returns {Promise<Rol[]>} Lista de roles activos ordenados alfabéticamente.
   */
  @Get('roles')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getRoles() {
    return this.adminService.getRoles();
  }

  /**
   * Obtiene todos los permisos activos ordenados por módulo y nombre.
   *
   * @returns {Promise<Permiso[]>} Lista de permisos activos.
   */
  @Get('permissions')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  /**
   * Crea una nueva cuenta de usuario profesor con su perfil de profesor asociado.
   *
   * @param {CreateProfesorDto} dto - Objeto de transferencia de datos con los detalles de registro del profesor.
   * @returns {Promise<{ id: string; user_id: string; username: string; cial: string; status: UserStatus }>} El resumen del profesor creado.
   * @throws {ConflictException} Cuando el nombre de usuario, el correo electrónico o el CIAL ya existen.
   */
  @Post('profesores')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

  /**
   * Actualiza el rol de un usuario específico, ajustando opcionalmente los permisos adicionales y excluidos.
   * El ID del usuario que realiza la llamada se extrae del JWT para aplicar las reglas de jerarquía de roles.
   *
   * @param {string} actorUserId - El ID del administrador autenticado (del JWT).
   * @param {string} userId - El ID del usuario objetivo (del parámetro de ruta).
   * @param {UpdateAdminUserRoleDto} dto - DTO que contiene el nuevo ID de rol y las sobreescrituras de permisos opcionales.
   * @returns {Promise<Usuario | null>} El usuario actualizado con roles y permisos.
   * @throws {NotFoundException} Cuando el usuario o el rol no se encuentran.
   * @throws {BadRequestException} Cuando el actor no tiene privilegios suficientes.
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
   * Activa o desactiva una cuenta de usuario.
   *
   * @param {string} userId - El ID del usuario a activar o desactivar (del parámetro de ruta).
   * @param {UpdateAdminUserActivationDto} dto - DTO con el estado de activación explícito opcional.
   * @returns {Promise<{ message: string; id: string; status: UserStatus; activo: boolean }>} Estado de activación actualizado.
   * @throws {NotFoundException} Cuando el usuario no se encuentra.
   * @throws {BadRequestException} Cuando el cambio eliminaría al último administrador activo.
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
   * Fuerza el restablecimiento de contraseña de un usuario, generando una contraseña provisional
   * y exigiendo al usuario que la cambie en el siguiente inicio de sesión.
   *
   * @param {string} userId - El ID del usuario cuya contraseña se restablecerá (del parámetro de ruta).
   * @returns {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean }>} La contraseña provisional y la confirmación del restablecimiento.
   * @throws {NotFoundException} Cuando el usuario no se encuentra.
   */
  @Post('users/:id/force-reset')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.resetear_password)
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
