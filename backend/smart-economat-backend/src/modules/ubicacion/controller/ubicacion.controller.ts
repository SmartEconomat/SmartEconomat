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
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

/** Controlador REST para la gestión de ubicaciones de almacenamiento. */
@ApiTags('Ubicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('ubicaciones')
export class UbicacionController extends BaseController<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  UbicacionService
> {
  constructor(service: UbicacionService) {
    super(service);
  }

  /** Crea una nueva ubicación de almacenamiento. */
  @Post()
  @RequirePermissions(PERMISSIONS.ubicaciones.crear)
  @ApiOperation({ summary: 'Crear nueva ubicación' })
  override create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return super.create(createUbicacionDto);
  }

  /** Lista todas las ubicaciones con paginación. Los admins también ven las eliminadas. */
  @Get()
  @RequirePermissions(PERMISSIONS.ubicaciones.listar)
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  override findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user: AuthenticatedUser }
  ) {
    return super.findAll(query, req);
  }

  /** Obtiene el detalle de una ubicación por su UUID. */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.ver)
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  override findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: AuthenticatedUser }
  ) {
    return super.findOne(id, req);
  }

  /** Actualiza los datos de una ubicación existente. */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.editar)
  @ApiOperation({ summary: 'Actualizar una ubicación' })
  override update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto
  ) {
    return super.update(id, updateUbicacionDto);
  }

  /** Elimina lógicamente una ubicación (soft delete). */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.eliminar)
  @ApiOperation({ summary: 'Eliminar una ubicación lógica' })
  override remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return super.remove(id);
  }

  /** Restaura una ubicación previamente eliminada. */
  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.ubicaciones.restaurar)
  @ApiOperation({ summary: 'Restaurar una ubicación eliminada' })
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.service.restore(id);
  }
}
