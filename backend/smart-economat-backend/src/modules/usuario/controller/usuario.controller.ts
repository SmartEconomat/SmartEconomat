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
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UsuarioService } from '../service/usuario.service';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { ApiQuery } from '@nestjs/swagger';
import { UpdateUsuarioStatusDto } from '../dto/update-status.dto';
import { UpdateUsuarioRolDto } from '../dto/update-rol.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/permisos.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('perfil')
  getPerfil(@GetUser('id') id: string) {
    return this.usuarioService.findOne(id);
  }

  @Patch('perfil')
  updatePerfil(@GetUser('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
  }

  @Patch('perfil/password')
  changePassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usuarioService.changePassword(id, dto);
  }

  @Get()
  @RequirePermissions('usuarios:listar')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usuarioService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('usuarios:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('usuarios:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  @Patch(':id/activar')
  @RequirePermissions('usuarios:activar_desactivar')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioStatusDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  @Patch(':id/rol')
  @RequirePermissions('usuarios:cambiar_rol')
  updateRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioRolDto
  ) {
    return this.usuarioService.update(id, dto);
  }

  @Patch(':id/password')
  @RequirePermissions('usuarios:resetear_password')
  updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto
  ) {
    return this.usuarioService.resetPassword(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('usuarios:eliminar')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

  @Post(':id/permisos-adicionales/:permisoId')
  @RequirePermissions('permisos:gestionar')
  addAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addAdditionalPermission(id, permisoId);
  }

  @Delete(':id/permisos-adicionales/:permisoId')
  @RequirePermissions('permisos:gestionar')
  removeAdditionalPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeAdditionalPermission(id, permisoId);
  }

  @Post(':id/permisos-excluidos/:permisoId')
  @RequirePermissions('permisos:gestionar')
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.addExcludedPermission(id, permisoId);
  }

  @Delete(':id/permisos-excluidos/:permisoId')
  @RequirePermissions('permisos:gestionar')
  removeExcludedPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string
  ) {
    return this.usuarioService.removeExcludedPermission(id, permisoId);
  }
}
