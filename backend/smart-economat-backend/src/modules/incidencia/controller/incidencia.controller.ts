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

@ApiTags('incidencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias')
export class IncidenciaController {
  constructor(private readonly incidenciaService: IncidenciaService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.incidencias.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.incidenciaService.create(dto);
  }

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

  @Get(':id')
  @RequirePermissions(PERMISSIONS.incidencias.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Incidencia> {
    const userRole = req.user?.rol;
    return this.incidenciaService.findOne(id, userRole);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.incidencias.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaDto
  ): Promise<Incidencia> {
    return this.incidenciaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.incidencias.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaService.remove(id);
  }

  @Patch(':id/resolver')
  @RequirePermissions(PERMISSIONS.incidencias.resolver)
  resolver(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ResolverIncidenciaDto,
    @GetUser('id') usuarioId: string
  ): Promise<Incidencia> {
    return this.incidenciaService.resolverIncidencia(id, dto, usuarioId);
  }

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
