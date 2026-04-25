/**
 * @module IncidenciaController
 * REST controller for the /incidencias resource. Exposes endpoints for
 * creating, listing, retrieving, updating, deleting and resolving incidencias.
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

/**
 * Controller that handles HTTP requests for incidencias (supply discrepancies).
 * All routes are protected by JWT authentication and role-based permissions.
 * @class IncidenciaController
 */
@ApiTags('incidencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias')
export class IncidenciaController {
  /**
   * Constructs the IncidenciaController with its required service dependency.
   * @param {IncidenciaService} incidenciaService - Service that handles incidencia business logic.
   */
  constructor(private readonly incidenciaService: IncidenciaService) {}

  /**
   * Creates a new incidencia with its associated product lines.
   * @param {CreateIncidenciaDto} dto - Payload describing the incidencia and its lines.
   * @returns {Promise<Incidencia>} The newly created Incidencia entity.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.incidenciaService.create(dto);
  }

  /**
   * Returns a paginated list of incidencias, optionally filtered and sorted.
   * @param {IncidenciaQueryDto} query - Filtering, pagination and sorting parameters.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<PaginatedResponseDto<Incidencia>>} Paginated result with computed estados.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  findAll(
    @SortableFields(
      ['recepcionId', 'pedidoId', 'fechaResolucion', 'createdAt', 'updatedAt'],
      IncidenciaQueryDto
    )
    query: IncidenciaQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Incidencia>> {
    const userRole = req.user?.rol;
    return this.incidenciaService.findAll(query, userRole);
  }

  /**
   * Retrieves a single incidencia by its UUID with all relations loaded.
   * @param {string} id - UUIDv7 of the incidencia to retrieve.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<Incidencia>} The found Incidencia with computed estado.
   * @throws {NotFoundException} If no incidencia with the given ID exists.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.incidencias.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Incidencia> {
    const userRole = req.user?.rol;
    return this.incidenciaService.findOne(id, userRole);
  }

  /**
   * Partially updates the header fields of an open incidencia.
   * @param {string} id - UUIDv7 of the incidencia to update.
   * @param {UpdateIncidenciaDto} dto - Partial payload with the fields to update.
   * @returns {Promise<Incidencia>} The updated Incidencia with computed estado.
   * @throws {NotFoundException} If no incidencia with the given ID exists.
   * @throws {BadRequestException} If the incidencia is already resolved.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.incidencias.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaDto
  ): Promise<Incidencia> {
    return this.incidenciaService.update(id, dto);
  }

  /**
   * Permanently removes an open incidencia. Returns HTTP 204 No Content on success.
   * @param {string} id - UUIDv7 of the incidencia to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If no incidencia with the given ID exists.
   * @throws {BadRequestException} If the incidencia is already resolved.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.incidencias.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaService.remove(id);
  }

  /**
   * Resolves an incidencia, optionally applying line-level quantity adjustments.
   * Delegates to the service's `resolverIncidencia` method.
   * @param {string} id - UUIDv7 of the incidencia to resolve.
   * @param {ResolverIncidenciaDto} dto - Resolution payload with optional adjustments and final state.
   * @param {string} usuarioId - ID of the authenticated user, extracted from the JWT token.
   * @returns {Promise<Incidencia>} The resolved Incidencia with updated estado.
   * @throws {NotFoundException} If no incidencia with the given ID exists.
   * @throws {BadRequestException} If the incidencia is already resolved or has no lines.
   */
  @Patch(':id/resolver')
  @RequirePermissions(PERMISSIONS.incidencias.resolver)
  resolver(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ResolverIncidenciaDto,
    @GetUser('id') usuarioId: string
  ): Promise<Incidencia> {
    return this.incidenciaService.resolverIncidencia(id, dto, usuarioId);
  }

  /**
   * Automatically reports a new incidencia by detecting discrepancies in a recepcion's lines.
   * @param {ReportIncidenciaDto} dto - DTO containing the recepcionId and the reported incidencia type.
   * @returns {Promise<Incidencia>} The newly created Incidencia.
   * @throws {NotFoundException} If the referenced Recepcion does not exist.
   * @throws {BadRequestException} If no product lines show a discrepancy.
   */
  @Post('reportar')
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @ApiOperation({
    summary: 'Reporta una nueva incidencia vinculada a una recepción',
  })
  @ApiResponse({
    status: 201,
    description: 'Incidencia reportada correctamente',
  })
  reportar(@Body() dto: ReportIncidenciaDto): Promise<Incidencia> {
    return this.incidenciaService.reportarIncidencia(dto);
  }

  /**
   * Resolves an incidencia using the legacy transactional flow (creates an
   * IncidenciaResuelta record and optionally registers a stock movement).
   * @param {string} id - UUIDv7 of the incidencia to resolve.
   * @param {ResolveIncidenciaDto} dto - Resolution data including the action type and observations.
   * @param {string} usuarioId - ID of the authenticated user, extracted from the JWT token.
   * @returns {Promise<Incidencia>} The resolved Incidencia with computed estado.
   * @throws {NotFoundException} If no incidencia with the given ID exists.
   * @throws {BadRequestException} If the incidencia is already resolved or has no lines.
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
    return this.incidenciaService.resolverIncidenciaTransaccional(
      id,
      dto,
      usuarioId
    );
  }
}
