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
import { IncidenciaResuelaService } from '../service/incidencia-resuelta.service';
import { CreateIncidenciaResuelaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaResuelaDto } from '../dto/update-incidencia.dto';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('incidencias-resueltas')
export class IncidenciaResuelaController {
  constructor(
    private readonly incidenciaResuelaService: IncidenciaResuelaService
  ) {}

  @Post()
  @RequirePermissions('incidencias:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateIncidenciaResuelaDto): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.create(dto);
  }

  @Get()
  @RequirePermissions('incidencias:listar')
  findAll(
    @SortableFields([
      'fechaResolucion',
      'tipoResolucion',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<IncidenciaResuelta>> {
    return this.incidenciaResuelaService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('incidencias:ver')
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('incidencias:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateIncidenciaResuelaDto
  ): Promise<IncidenciaResuelta> {
    return this.incidenciaResuelaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('incidencias:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.incidenciaResuelaService.remove(id);
  }
}
