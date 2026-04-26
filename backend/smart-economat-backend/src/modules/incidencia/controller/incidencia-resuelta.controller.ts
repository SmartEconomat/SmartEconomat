/**
 * Documentación en español.
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
 * Documentación en español.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias-resueltas')
export class IncidenciaResuelaController {
        /**
     * Documentación en español.
     */
  constructor(
    private readonly incidenciaResuelaService: IncidenciaResuelaService
  ) {}

        /**
     * Documentación en español.
     */
  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.create(dto);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.incidencias.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaResuelaService.remove(id);
  }
}
