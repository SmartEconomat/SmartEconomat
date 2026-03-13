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
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { IncidenciaService } from '../service/incidencia.service';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { ResolverIncidenciaDto } from '../dto/resolver-incidencia.dto';
import { ReportIncidenciaDto } from '../dto/report-incidencia.dto';
import { ResolveIncidenciaDto } from '../dto/resolve-incidencia.dto';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('incidencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias')
export class IncidenciaController {
  constructor(private readonly incidenciaService: IncidenciaService) {}

  @Post()
  @RequirePermissions('incidencias:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.incidenciaService.create(dto);
  }

  @Get()
  @RequirePermissions('incidencias:listar')
  findAll(
    @SortableFields([
      'recepcionId',
      'pedidoId',
      'fechaResolucion',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Incidencia>> {
    return this.incidenciaService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('incidencias:ver')
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Incidencia> {
    return this.incidenciaService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('incidencias:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaDto
  ): Promise<Incidencia> {
    return this.incidenciaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('incidencias:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaService.remove(id);
  }

  @Patch(':id/resolver')
  @RequirePermissions('incidencias:resolver')
  resolver(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ResolverIncidenciaDto
  ): Promise<Incidencia> {
    return this.incidenciaService.resolverIncidencia(id, dto);
  }

  @Post('reportar')
  @RequirePermissions('incidencias:crear')
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
  @RequirePermissions('incidencias:resolver')
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
