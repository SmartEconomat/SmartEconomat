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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { UsuarioService } from '../service/usuario.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { UpdateUsuarioStatusDto } from '../dto/update-status.dto';
import { UpdateUsuarioRolDto } from '../dto/update-rol.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
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
 * Controlador de administración de usuarios.
 * Solo incluye operaciones CRUD y gestión de permisos granulares.
 * Los endpoints de auto-servicio (perfil, contraseña, preferencias) viven en UsuarioPerfilController.
 */
@ApiTags('Usuarios (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  /** Crea un nuevo usuario en el sistema. */
  @Post()
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  /** Crea un usuario con privilegios administrativos (solo ADMIN). */
  @Post('admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  @ApiOperation({ summary: 'Crear usuario administrativo' })
  createAdmin(@Body() dto: AdminCreateUsuarioDto) {
    return this.usuarioService.createAdmin(dto);
  }

  /** Lista todos los usuarios con paginación. */
  @Get()
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(
    @SortableFields(SORTABLE_FIELDS.usuarios)
    query: PaginationQueryDto,
    @GetUser('rol') userRole: string
  ) {
    return this.usuarioService.findAll(query, userRole);
  }

  /** Lista usuarios en formato mínimo (id + nombre) para selectores. */
  @Get('minimos')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  @ApiOperation({ summary: 'Listar usuarios (formato mínimo para selectores)' })
  findAllMinimal() {
    return this.usuarioService.findAllMinimal();
  }

  /** Obtiene el detalle de un usuario por UUID. */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.usuarios.ver)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

  /** Actualiza los datos de un usuario. */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /** Actualización administrativa de usuario (solo ADMIN). */
  @Patch(':id/admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Actualización administrativa de usuario' })
  updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUsuarioDto
  ) {
    return this.usuarioService.updateAdmin(id, dto);
  }

  /** Activa o desactiva la cuenta de un usuario. */
  @Patch(':id/activar')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Activar o desactivar usuario' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioStatusDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /** Cambia el rol principal de un usuario. */
  @Patch(':id/rol')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Cambiar rol del usuario' })
  updateRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioRolDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  /** Fuerza el restablecimiento de contraseña (admin). */
  @Patch(':id/password')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Forzar restablecimiento de contraseña' })
  updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto
  ) {
    return this.usuarioService.resetPassword(id, dto);
  }

  /** Elimina un usuario del sistema (soft delete). */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.usuarios.eliminar)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

  /** Añade un permiso adicional a un usuario, independientemente de su rol. */
  @Post(':id/permisos-adicionales/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Añadir permiso adicional a usuario' })
  addAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addAdditionalPermission(id, permisoId);
  }

  /** Elimina un permiso adicional previamente asignado a un usuario. */
  @Delete(':id/permisos-adicionales/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Eliminar permiso adicional de usuario' })
  removeAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeAdditionalPermission(id, permisoId);
  }

  /** Añade un permiso a la lista de exclusiones del usuario (sobrescribe permiso del rol). */
  @Post(':id/permisos-excluidos/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Excluir permiso de usuario' })
  addExcludedPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addExcludedPermission(id, permisoId);
  }

  /** Elimina un permiso de la lista de exclusiones del usuario. */
  @Delete(':id/permisos-excluidos/:permisoId')
  @RequirePermissions(PERMISSIONS.usuarios.editar)
  @ApiOperation({ summary: 'Restaurar permiso excluido de usuario' })
  removeExcludedPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeExcludedPermission(id, permisoId);
  }
}
