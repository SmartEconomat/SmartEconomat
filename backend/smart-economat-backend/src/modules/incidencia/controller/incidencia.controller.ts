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
  Request,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { IncidenciaService } from '../service/incidencia.service';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { ResolverIncidenciaDto } from '../dto/resolver-incidencia.dto';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

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
  findAll(): Promise<Incidencia[]> {
    return this.incidenciaService.findAll();
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
    @Body() dto: ResolverIncidenciaDto,
    @Request() req: any
  ): Promise<Incidencia> {
    const userId = req.user?.sub;
    if (userId) {
      dto.usuarioId = userId;
    }
    return this.incidenciaService.resolverIncidencia(id, dto);
  }
}
