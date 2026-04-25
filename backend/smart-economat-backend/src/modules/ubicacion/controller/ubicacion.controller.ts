import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { UbicacionService } from '../service/ubicacion.service';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { BaseController } from '../../../common/base/base.controller';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * REST controller that exposes CRUD endpoints for warehouse locations (Ubicacion),
 * extending BaseController and adding a restore endpoint for soft-deleted records.
 *
 * @class UbicacionController
 */
@ApiTags('Ubicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('ubicacion')
export class UbicacionController extends BaseController<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  UbicacionService
> {
  /**
   * Creates an instance of UbicacionController.
   *
   * @param {UbicacionService} service - Service layer for location operations.
   */
  constructor(service: UbicacionService) {
    super(service);
  }

  /**
   * Creates a new warehouse location.
   *
   * @param {CreateUbicacionDto} createUbicacionDto - Location creation payload.
   * @returns {Promise<Ubicacion>} The newly created location entity.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.ubicaciones.crear)
  @ApiOperation({ summary: 'Crear nueva ubicación' })
  override create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return super.create(createUbicacionDto);
  }

  /**
   * Returns a paginated list of warehouse locations. Admin users also see
   * soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and sort parameters.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<PaginatedResponseDto<Ubicacion>>} Paginated location list.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.ubicaciones.listar)
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  override findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return super.findAll(query, req);
  }

  /**
   * Retrieves a single warehouse location by UUID.
   *
   * @param {string} id - UUID v7 of the location.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<Ubicacion>} The found location entity.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.ver)
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  override findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ) {
    return super.findOne(id, req);
  }

  /**
   * Partially updates a warehouse location's fields.
   *
   * @param {string} id - UUID v7 of the location to update.
   * @param {UpdateUbicacionDto} updateUbicacionDto - Fields to update.
   * @returns {Promise<Ubicacion>} The updated location entity.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.editar)
  @ApiOperation({ summary: 'Actualizar una ubicación' })
  override update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto
  ) {
    return super.update(id, updateUbicacionDto);
  }

  /**
   * Soft-deletes a warehouse location (logical delete).
   *
   * @param {string} id - UUID v7 of the location to delete.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.eliminar)
  @ApiOperation({ summary: 'Eliminar una ubicación lógica' })
  override remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return super.remove(id);
  }

  /**
   * Restores a previously soft-deleted warehouse location.
   *
   * @param {string} id - UUID v7 of the location to restore.
   * @returns {Promise<Ubicacion>} The restored location entity.
   */
  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.ubicaciones.restaurar)
  @ApiOperation({ summary: 'Restaurar una ubicación eliminada' })
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.service.restore(id);
  }
}
