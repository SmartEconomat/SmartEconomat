import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
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
  constructor(service: UbicacionService) {
    super(service);
  }

  @Post()
  @RequirePermissions('ubicaciones:crear')
  @ApiOperation({ summary: 'Crear nueva ubicación' })
  override create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return super.create(createUbicacionDto);
  }

  @Get()
  @RequirePermissions('ubicaciones:listar')
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  override findAll() {
    return super.findAll({ page: 1, limit: 100 });
  }

  @Get(':id')
  @RequirePermissions('ubicaciones:ver')
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  override findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
    return super.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('ubicaciones:editar')
  @ApiOperation({ summary: 'Actualizar una ubicación' })
  override update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto
  ) {
    return super.update(id, updateUbicacionDto);
  }

  @Delete(':id')
  @RequirePermissions('ubicaciones:eliminar')
  @ApiOperation({ summary: 'Eliminar una ubicación lógica' })
  override remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return super.remove(id);
  }

  @Post(':id/restore')
  @RequirePermissions('ubicaciones:restaurar')
  @ApiOperation({ summary: 'Restaurar una ubicación eliminada' })
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.service.restore(id);
  }
}
