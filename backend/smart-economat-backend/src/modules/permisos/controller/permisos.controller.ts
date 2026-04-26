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
import { PermisosService } from '../service/permisos.service';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

@Controller('permisos')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
/**
 * Documentación en español.
 */
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.permisos.listar)
  findAll(@Query() query: PaginationQueryDto) {
    return this.permisosService.findAll(query);
  }

  @Get('all')
  @RequirePermissions(PERMISSIONS.permisos.listar)
  findAllNoPagination() {
    return this.permisosService.findAllNoPagination();
  }

  @Get('grouped')
  @RequirePermissions(PERMISSIONS.permisos.listar)
  findGroupedByModule() {
    return this.permisosService.findGroupedByModule();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.permisos.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisosService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.permisos.crear)
  create(@Body() dto: CreatePermisoDto) {
    return this.permisosService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.permisos.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermisoDto
  ) {
    return this.permisosService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.permisos.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.permisosService.remove(id);
    return { message: 'Permiso eliminado correctamente' };
  }
}
