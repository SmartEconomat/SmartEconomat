import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from '../service/roles.service';
import { CreateRolDto } from '../dto/create-rol.dto';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { AssignRoleToUserDto } from '../dto/assign-role-to-user.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { GetUser } from '../../sherlock-auth/decorators/get-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
/**
 * Documentación en español.
 */
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAll(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get('all')
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAllNoPagination() {
    return this.rolesService.findAllNoPagination();
  }

  @Get('users/:usuarioId')
  @RequirePermissions(PERMISSIONS.roles.listar)
  getUserRoles(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.rolesService.getUserRoles(usuarioId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.roles.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.roles.crear)
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Post('assign-user')
  @RequirePermissions(PERMISSIONS.roles.editar)
  assignRoleToUser(
    @Body() dto: AssignRoleToUserDto,
    @GetUser('id') actorId: string
  ) {
    return this.rolesService.assignRoleToUser(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roles.editar)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permisos')
  @RequirePermissions(PERMISSIONS.roles.editar)
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
    @GetUser('id') actorId: string
  ) {
    return this.rolesService.assignPermissions(id, dto, actorId);
  }

  @Delete(':id/users/:usuarioId')
  @RequirePermissions(PERMISSIONS.roles.editar)
  removeRoleFromUser(
    @Param('id', ParseUUIDPipe) rolId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string
  ) {
    return this.rolesService.removeRoleFromUser(usuarioId, rolId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roles.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.remove(id);
    return { message: 'Rol eliminado correctamente' };
  }
}
