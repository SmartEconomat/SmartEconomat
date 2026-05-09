/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { IncidenciaResuelaService } from '../service/incidencia-resuelta.service';
import { CreateIncidenciaResuelaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaResuelaDto } from '../dto/update-incidencia.dto';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador REST para incidencia resuela.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias-resueltas')
export class IncidenciaResuelaController {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    private readonly incidenciaResuelaService: IncidenciaResuelaService
  ) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateIncidenciaResuelaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<IncidenciaResuelta>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.create(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<IncidenciaResuelta>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.incidenciasResueltas)
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    const userRole = req.user?.rol;
    return this.incidenciaResuelaService.findAll(query, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<IncidenciaResuelta>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.incidencias.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<IncidenciaResuelta> {
    const userRole = req.user?.rol;
    return this.incidenciaResuelaService.findOne(id, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateIncidenciaResuelaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<IncidenciaResuelta>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.incidencias.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaResuelaDto
  ): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.update(id, dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.incidencias.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaResuelaService.remove(id);
  }
}
