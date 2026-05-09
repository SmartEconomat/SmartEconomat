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
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (RolesController). Paquete: smart-economat-backend (Nest). */
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
@Roles(rolUsuario.ADMIN)
/**
 * Controlador REST para roles.
 */
export class RolesController {
  /**
   * Construye la instancia configurada.
   * @undefined {RolesService} rolesService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/paginated-response.dto").PaginatedResponseDto<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAll(@SortableFields(SORTABLE_FIELDS.roles) query: PaginationQueryDto) {
    return this.rolesService.findAll(query);
  }

  /**
   * Expone "findAllNoPagination" en smart-economat-backend (Nest).
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('all')
  @RequirePermissions(PERMISSIONS.roles.listar)
  findAllNoPagination() {
    return this.rolesService.findAllNoPagination();
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('users/:usuarioId')
  @RequirePermissions(PERMISSIONS.roles.listar)
  getUserRoles(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.rolesService.getUserRoles(usuarioId);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.roles.ver)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateRolDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.roles.crear)
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  /**
   * Expone "assignRoleToUser" en smart-economat-backend (Nest).
   * @undefined {AssignRoleToUserDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} actorId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/usuario-rol.entity/usuario-rol.entity").UsuarioRol>} Datos efectivos después de ejecutar la operación.
   */
  @Post('assign-user')
  @RequirePermissions(PERMISSIONS.roles.editar)
  assignRoleToUser(
    @Body() dto: AssignRoleToUserDto,
    @GetUser('id') actorId: string
  ) {
    return this.rolesService.assignRoleToUser(dto, actorId);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateRolDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roles.editar)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  /**
   * Expone "assignPermissions" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {AssignPermissionsDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} actorId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/roles/rol.entity/rol.entity").Rol>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/permisos')
  @RequirePermissions(PERMISSIONS.roles.editar)
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
    @GetUser('id') actorId: string
  ) {
    return this.rolesService.assignPermissions(id, dto, actorId);
  }

  /**
   * Expone "removeRoleFromUser" en smart-economat-backend (Nest).
   * @undefined {string} rolId - Entrada efectiva esperada por el contrato.
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id/users/:usuarioId')
  @RequirePermissions(PERMISSIONS.roles.editar)
  removeRoleFromUser(
    @Param('id', ParseUUIDPipe) rolId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string
  ) {
    return this.rolesService.removeRoleFromUser(usuarioId, rolId);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roles.eliminar)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.remove(id);
    return { message: 'Rol eliminado correctamente' };
  }
}
