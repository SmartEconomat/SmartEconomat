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
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (PermisosController). Paquete: smart-economat-backend (Nest). */
@Controller('permisos')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
/**
 * Controlador REST para permisos.
 */
export class PermisosController {
  /**
   * Construye la instancia configurada.
   * @undefined {PermisosService} permisosService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly permisosService: PermisosService) {}

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/paginated-response.dto").PaginatedResponseDto<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.permisos.listar)
  findAll(@SortableFields(SORTABLE_FIELDS.permisos) query: PaginationQueryDto) {
    return this.permisosService.findAll(query);
  }

  /**
   * Expone "findAllNoPagination" en smart-economat-backend (Nest).
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso[]>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePermisoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.permisos.crear)
  create(@Body() dto: CreatePermisoDto) {
    return this.permisosService.create(dto);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePermisoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/permisos/permiso.entity/permiso.entity").Permiso>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.permisos.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermisoDto
  ) {
    return this.permisosService.update(id, dto);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.permisos.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.permisosService.remove(id);
    return { message: 'Permiso eliminado correctamente' };
  }
}
