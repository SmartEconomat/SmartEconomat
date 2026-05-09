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
import { UpdateSelfPerfilDto } from '../dto/update-self-perfil.dto';
import { UpdateMisUbicacionesDto } from '../dto/update-mis-ubicaciones.dto';
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
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de usuarios, perfiles y permisos granulares.
 * Permite la administración de cuentas de usuario, cambios de contraseña,
 * y la asignación/exclusión de permisos adicionales sobre los roles base.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
  /**
   * Crea una instancia de UsuarioController.
   * @param usuarioService Servicio para la gestión lógica de usuarios.
   */
  constructor(private readonly usuarioService: UsuarioService) {}

  /**
   * Crea un nuevo usuario en el sistema.
   * @param dto Datos del usuario (nombre, email, rol, contraseña).
   * @returns El usuario creado.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  /**
   * Crea un usuario con privilegios administrativos (solo accesible por ADMIN).
   * @param dto Datos extendidos de creación administrativa.
   * @returns El usuario administrativo creado.
   */
  @Post('admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  createAdmin(@Body() dto: AdminCreateUsuarioDto) {
    return this.usuarioService.createAdmin(dto);
  }

  /**
   * Obtiene la información del perfil del usuario autenticado, incluyendo sus permisos efectivos.
   * @param id ID del usuario obtenido del token JWT.
   * @returns Perfil completo del usuario.
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
   * Catálogo mínimo de ubicaciones para enlazar la cuenta (Inventario → Mis ubicaciones).
   */
  @Get('perfil/catalogo-ubicaciones')
  getCatalogoUbicacionesParaPerfil() {
    return this.usuarioService.findCatalogoUbicacionesParaEnlaces();
  }

  /**
   * Actualiza los vínculos usuario↔ubicación del propio usuario.
   */
  @Patch('perfil/mis-ubicaciones')
  updateMisUbicacionesPerfil(
    @GetUser('id') id: string,
    @Body() dto: UpdateMisUbicacionesDto
  ) {
    return this.usuarioService.updateMisUbicaciones(id, dto);
  }

  /**
   * Actualiza la información del perfil del usuario autenticado.
   * @param id ID del usuario.
   * @param dto Datos a actualizar.
   * @returns El usuario actualizado.
   */
  @Patch('perfil')
  updatePerfil(@GetUser('id') id: string, @Body() dto: UpdateSelfPerfilDto) {
    return this.usuarioService.update(id, dto);
  }

  /**
   * Actualiza las preferencias del usuario (tutoriales, configuración UI).
   * @param id ID del usuario.
   * @param preferences Objeto de preferencias.
   * @returns El usuario actualizado.
   */
  @Patch('perfil/preferences')
  updatePreferences(
    @GetUser('id') id: string,
    @Body() preferences: Record<string, any>
  ) {
    return this.usuarioService.updatePreferences(id, preferences);
  }

  /**
   * Cambia la contraseña del usuario autenticado verificando la anterior.
   * @param id ID del usuario.
   * @param dto Contraseña antigua y nueva.
   * @returns Resultado de la operación.
   */
  @Patch('perfil/password')
  changePassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usuarioService.changePassword(id, dto);
  }

  /**
   * Lista todos los usuarios con soporte para paginación y ordenación.
   * @param query Parámetros de consulta.
   * @param userRole Rol del usuario que realiza la consulta.
   * @returns Lista paginada de usuarios.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.usuarios)
    query: PaginationQueryDto,
    @GetUser('rol') userRole: string
  ) {
    return this.usuarioService.findAll(query, userRole);
  }

  /**
   * Obtiene una lista minimalista de usuarios (ID y nombre) para selectores.
   * @returns Lista de usuarios simplificada.
   */
  /**
   * Expone "findAllMinimal" en smart-economat-backend (Nest).
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity").Usuario[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('minimos')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  findAllMinimal() {
    return this.usuarioService.findAllMinimal();
  }

  /**
   * Obtiene el detalle de un usuario por su UUID.
   * @param id UUID del usuario.
   * @returns El usuario encontrado.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.usuarios.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

  /**
   * Actualiza la información de un usuario específico.
   * @param id UUID del usuario.
   * @param dto Datos a actualizar.
   * @returns El usuario actualizado.
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
   * Actualización administrativa de un usuario (solo para ADMIN).
   * @param id UUID del usuario.
   * @param dto Datos administrativos.
   * @returns El usuario actualizado.
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
   * Activa o desactiva la cuenta de un usuario.
   * @param id UUID del usuario.
   * @param dto Estado de activación.
   * @returns El usuario con el nuevo estado.
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
   * Cambia el rol principal de un usuario.
   * @param id UUID del usuario.
   * @param dto Nuevo rol.
   * @returns El usuario actualizado.
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
   * Fuerza el restablecimiento de la contraseña de un usuario por un administrador.
   * @param id UUID del usuario.
   * @param dto Nueva contraseña.
   * @returns Resultado de la operación.
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
   * Elimina un usuario del sistema (eliminación lógica).
   * @param id UUID del usuario.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.usuarios.eliminar)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

  /**
   * Añade un permiso individual adicional a un usuario, independientemente de su rol.
   * @param id UUID del usuario.
   * @param permisoId UUID del permiso.
   * @returns Resultado de la asociación.
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
   * Elimina un permiso adicional previamente asignado.
   * @param id UUID del usuario.
   * @param permisoId UUID del permiso.
   */
  /**
   * Expone "removeAdditionalPermission" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} permisoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity").Usuario>} Datos efectivos después de ejecutar la operación.
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
   * Añade un permiso a la lista de exclusiones de un usuario.
   * El usuario NO tendrá este permiso aunque su rol se lo otorgue.
   * @param id UUID del usuario.
   * @param permisoId UUID del permiso.
   */
  /**
   * Expone "addExcludedPermission" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} permisoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/usuario.entity/usuario.entity").Usuario>} Datos efectivos después de ejecutar la operación.
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
   * Elimina un permiso de la lista de exclusiones.
   * @param id UUID del usuario.
   * @param permisoId UUID del permiso.
   */
  /**
   * Expone "removeExcludedPermission" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} permisoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ success: boolean; }>} Datos efectivos después de ejecutar la operación.
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
