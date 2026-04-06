import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlantillasRolesService } from '../service/plantillas-roles.service';
import { CreatePlantillaDto } from '../dto/create-plantilla.dto';
import { UpdatePlantillaDto } from '../dto/update-plantilla.dto';
import { DuplicatePlantillaDto } from '../dto/duplicate-plantilla.dto';
import { UpdatePlantillaActivoDto } from '../dto/update-plantilla-activo.dto';
import { UpdatePlantillaPermisosDto } from '../dto/update-plantilla-permisos.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

type PlantillasRolesCrudContract = {
  duplicateTemplate: (id: string, nombre?: string) => Promise<unknown>;
  setTemplateActivo: (id: string, activo: boolean) => Promise<unknown>;
};

@Controller('plantillas-roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
export class PlantillasRolesController {
  constructor(
    private readonly plantillasRolesService: PlantillasRolesService
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAll() {
    return this.plantillasRolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.roles.listar)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plantillasRolesService.findOne(id);
  }

  @Get(':id/permisos-efectivos')
  @RequirePermissions(PERMISSIONS.roles.listar)
  getPermisosEfectivos(@Param('id', ParseUUIDPipe) id: string) {
    return this.plantillasRolesService.getPermisosEfectivos(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.roles.crear)
  create(@Body() dto: CreatePlantillaDto) {
    return this.plantillasRolesService.create(dto);
  }

  @Post(':id/duplicar')
  @RequirePermissions(PERMISSIONS.roles.crear)
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicatePlantillaDto
  ) {
    const service = this
      .plantillasRolesService as unknown as PlantillasRolesCrudContract;
    return service.duplicateTemplate(id, dto.nombre);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roles.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantillaDto
  ) {
    return this.plantillasRolesService.update(id, dto);
  }

  @Patch(':id/permisos')
  @RequirePermissions(PERMISSIONS.roles.editar)
  updatePermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantillaPermisosDto
  ) {
    return this.plantillasRolesService.updatePermisos(id, dto.permisoIds);
  }

  @Patch(':id/activo')
  @RequirePermissions(PERMISSIONS.roles.editar)
  setActivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantillaActivoDto
  ) {
    const service = this
      .plantillasRolesService as unknown as PlantillasRolesCrudContract;
    return service.setTemplateActivo(id, dto.activo);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roles.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.plantillasRolesService.remove(id);
    return { message: 'Plantilla eliminada correctamente' };
  }
}
