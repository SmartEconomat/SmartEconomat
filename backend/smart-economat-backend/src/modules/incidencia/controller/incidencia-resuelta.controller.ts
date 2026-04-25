/**
 * @module IncidenciaResuelaController
 * REST controller for the /incidencias-resueltas resource.
 * Exposes CRUD endpoints for managing incidencia resolution records.
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
  Query,
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

/**
 * Controller that handles HTTP requests for incidencia resolution records.
 * All routes are protected by JWT authentication and role-based permissions.
 * @class IncidenciaResuelaController
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias-resueltas')
export class IncidenciaResuelaController {
  /**
   * Constructs the IncidenciaResuelaController with its required service dependency.
   * @param {IncidenciaResuelaService} incidenciaResuelaService - Service that handles resolution business logic.
   */
  constructor(
    private readonly incidenciaResuelaService: IncidenciaResuelaService
  ) {}

  /**
   * Creates a new resolution record for an existing open incidencia.
   * Also closes the parent incidencia entity.
   * @param {CreateIncidenciaResuelaDto} dto - Payload with the incidencia ID, resolver user ID,
   *   resolution type and optional observations.
   * @returns {Promise<IncidenciaResuelta>} The newly created resolution record.
   * @throws {NotFoundException} If the referenced incidencia does not exist.
   * @throws {BadRequestException} If the incidencia is already resolved.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.create(dto);
  }

  /**
   * Returns a paginated list of incidencia resolution records.
   * Admin roles also see soft-deleted records.
   * @param {PaginationQueryDto} query - Pagination and sorting parameters.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<PaginatedResponseDto<IncidenciaResuelta>>} Paginated result of resolution records.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    const userRole = req.user?.rol;
    return this.incidenciaResuelaService.findAll(query, userRole);
  }

  /**
   * Retrieves a single resolution record by its UUID.
   * @param {string} id - UUIDv7 of the resolution record to retrieve.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<IncidenciaResuelta>} The found resolution record with relations.
   * @throws {NotFoundException} If no resolution record with the given ID exists.
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
   * Partially updates a resolution record (type, observations, resolver user).
   * @param {string} id - UUIDv7 of the resolution record to update.
   * @param {UpdateIncidenciaResuelaDto} dto - Partial payload with the fields to change.
   * @returns {Promise<IncidenciaResuelta>} The updated resolution record.
   * @throws {NotFoundException} If no resolution record with the given ID exists.
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
   * Soft-deletes a resolution record and reopens the parent incidencia.
   * Returns HTTP 204 No Content on success.
   * @param {string} id - UUIDv7 of the resolution record to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If no resolution record with the given ID exists.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.incidencias.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaResuelaService.remove(id);
  }
}
