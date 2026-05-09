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
  UseGuards,
  Req,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { IncidenciaService } from '../service/incidencia.service';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { ResolverIncidenciaDto } from '../dto/resolver-incidencia.dto';
import { ReportIncidenciaDto } from '../dto/report-incidencia.dto';
import { ResolveIncidenciaDto } from '../dto/resolve-incidencia.dto';
import { IncidenciaQueryDto } from '../dto/incidencia-query.dto';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { validateDateRange } from '../../../common/utils/date-range.util';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador REST para incidencia.
 */
@ApiTags('incidencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias')
export class IncidenciaController {
  private withIncidenciaLabels<T extends { estado?: string | null }>(
    incidencia: T
  ): T & { estadoLabelKey?: string } {
    if (!incidencia?.estado) {
      return incidencia;
    }

    return {
      ...incidencia,
      estadoLabelKey: `enum.incidenciaEstado.${String(incidencia.estado).toUpperCase()}`,
    };
  }
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly incidenciaService Parámetro de entrada para la operación.
   */
  constructor(private readonly incidenciaService: IncidenciaService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.incidenciaService
      .create(dto)
      .then((incidencia) => this.withIncidenciaLabels(incidencia));
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {IncidenciaQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Incidencia>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.incidencias, IncidenciaQueryDto)
    query: IncidenciaQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Incidencia>> {
    validateDateRange(query.startDate, query.endDate, 365, 'Incidencias');
    const userRole = req.user?.rol;
    return this.incidenciaService.findAll(query, userRole).then((result) => ({
      ...result,
      data: result.data.map((incidencia) =>
        this.withIncidenciaLabels(incidencia)
      ),
    }));
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.incidencias.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Incidencia> {
    const userRole = req.user?.rol;
    return this.incidenciaService
      .findOne(id, userRole)
      .then((incidencia) => this.withIncidenciaLabels(incidencia));
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.incidencias.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaDto
  ): Promise<Incidencia> {
    return this.incidenciaService
      .update(id, dto)
      .then((incidencia) => this.withIncidenciaLabels(incidencia));
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
    return this.incidenciaService.remove(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "resolver" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {ResolverIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/resolver')
  @RequirePermissions(PERMISSIONS.incidencias.resolver)
  resolver(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ResolverIncidenciaDto,
    @GetUser('id') usuarioId: string
  ): Promise<Incidencia> {
    return this.incidenciaService
      .resolverIncidencia(id, dto, usuarioId)
      .then((incidencia) => this.withIncidenciaLabels(incidencia));
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "reportar" en smart-economat-backend (Nest).
   * @undefined {ReportIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia[]>} Datos efectivos después de ejecutar la operación.
   */
  @Post('reportar')
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @ApiOperation({
    summary:
      'Reporta nuevas incidencias vinculadas a una recepción (agrupadas por pedido y proveedor)',
  })
  @ApiResponse({
    status: 201,
    description: 'Incidencias reportadas correctamente',
  })
  reportar(@Body() dto: ReportIncidenciaDto): Promise<Incidencia[]> {
    return this.incidenciaService
      .reportarIncidencia(dto)
      .then((incidencias) =>
        incidencias.map((inc) => this.withIncidenciaLabels(inc))
      );
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "resolverTransaccional" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {ResolveIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  @Post(':id/resolver')
  @RequirePermissions(PERMISSIONS.incidencias.resolver)
  @ApiOperation({ summary: 'Resuelve una incidencia de forma transaccional' })
  @ApiResponse({
    status: 201,
    description: 'Incidencia resuelta correctamente',
  })
  resolverTransaccional(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ResolveIncidenciaDto,
    @GetUser('id') usuarioId: string
  ): Promise<Incidencia> {
    return this.incidenciaService
      .resolverIncidenciaTransaccional(id, dto, usuarioId)
      .then((incidencia) => this.withIncidenciaLabels(incidencia));
  }
}
