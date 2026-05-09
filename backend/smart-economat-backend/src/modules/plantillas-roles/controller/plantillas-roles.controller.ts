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

/** Clase pública (PlantillasRolesController). Paquete: smart-economat-backend (Nest). */
@Controller('plantillas-roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
/**
 * Controlador REST para plantillas roles.
 */
export class PlantillasRolesController {
  /**
   * Construye la instancia configurada.
   * @undefined {PlantillasRolesService} plantillasRolesService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly plantillasRolesService: PlantillasRolesService
  ) {}

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity").PlantillaRol[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAll() {
    return this.plantillasRolesService.findAll();
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity").PlantillaRol>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.roles.listar)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plantillasRolesService.findOne(id);
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ permisosDirectos: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso[]; permisosHeredados: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso[]; permisosEfectivos: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso[]; }>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id/permisos-efectivos')
  @RequirePermissions(PERMISSIONS.roles.listar)
  getPermisosEfectivos(@Param('id', ParseUUIDPipe) id: string) {
    return this.plantillasRolesService.getPermisosEfectivos(id);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePlantillaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity").PlantillaRol>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.roles.crear)
  create(@Body() dto: CreatePlantillaDto) {
    return this.plantillasRolesService.create(dto);
  }

  /**
   * Expone "duplicate" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {DuplicatePlantillaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<unknown>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePlantillaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity").PlantillaRol>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roles.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantillaDto
  ) {
    return this.plantillasRolesService.update(id, dto);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePlantillaPermisosDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity").PlantillaRol>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/permisos')
  @RequirePermissions(PERMISSIONS.roles.editar)
  updatePermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantillaPermisosDto
  ) {
    return this.plantillasRolesService.updatePermisos(id, dto.permisoIds);
  }

  /**
   * Establece referencias mutables internas del componente/servicio.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePlantillaActivoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<unknown>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roles.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.plantillasRolesService.remove(id);
    return { message: 'Plantilla eliminada correctamente' };
  }
}
