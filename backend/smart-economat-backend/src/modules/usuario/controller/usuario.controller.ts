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
 * Documentación en español.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
        /**
     * Documentación en español.
     */
  constructor(private readonly usuarioService: UsuarioService) {}

        /**
     * Documentación en español.
     */
  @Post()
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

        /**
     * Documentación en español.
     */
  @Post('admin')
  @Roles(rolUsuario.ADMIN)
  @RequirePermissions(PERMISSIONS.usuarios.crear)
  createAdmin(@Body() dto: AdminCreateUsuarioDto) {
    return this.usuarioService.createAdmin(dto);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  @Patch('perfil')
  updatePerfil(@GetUser('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
  }

        /**
     * Documentación en español.
     */
  @Patch('perfil/password')
  changePassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usuarioService.changePassword(id, dto);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  @Get('minimos')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  findAllMinimal() {
    return this.usuarioService.findAllMinimal();
  }

        /**
     * Documentación en español.
     */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.usuarios.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.usuarios.eliminar)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
