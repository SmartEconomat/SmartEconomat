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
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

@ApiTags('Ubicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('ubicacion')
export class UbicacionController {
  constructor(private readonly ubicacionService: UbicacionService) {}

  @Post()
  @RequirePermissions('ubicaciones:crear')
  @ApiOperation({ summary: 'Crear nueva ubicación' })
  create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return this.ubicacionService.create(createUbicacionDto);
  }

  @Get()
  @RequirePermissions('ubicaciones:listar')
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  findAll() {
    return this.ubicacionService.findAll();
  }

  @Get(':id')
  @RequirePermissions('ubicaciones:ver')
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.ubicacionService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('ubicaciones:editar')
  @ApiOperation({ summary: 'Actualizar una ubicación' })
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto
  ) {
    return this.ubicacionService.update(id, updateUbicacionDto);
  }

  @Delete(':id')
  @RequirePermissions('ubicaciones:eliminar')
  @ApiOperation({ summary: 'Eliminar una ubicación lógica' })
  remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.ubicacionService.remove(id);
  }

  @Post(':id/restore')
  @RequirePermissions('ubicaciones:restaurar')
  @ApiOperation({ summary: 'Restaurar una ubicación eliminada' })
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.ubicacionService.restore(id);
  }
}
