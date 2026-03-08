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
  UseGuards,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { HistorialPrecioService } from '../service/historial-precio.service';
import { CreateHistorialPrecioDto } from '../dto/historial-precio.dto/create-historial-precio.dto';
import { UpdateHistorialPrecioDto } from '../dto/historial-precio.dto/update-historial-precio.dto';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiQuery } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('historial-precio')
export class HistorialPrecioController {
  constructor(
    private readonly historialPrecioService: HistorialPrecioService
  ) {}

  @Post()
  @RequirePermissions('productos:editar')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateHistorialPrecioDto): Promise<HistorialPrecio> {
    return this.historialPrecioService.create(dto);
  }

  @Get()
  @RequirePermissions('productos:ver')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Dirección de ordenamiento por fecha',
  })
  findAll(
    @Query('order') order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<HistorialPrecio[]> {
    return this.historialPrecioService.findAll(order);
  }

  @Get(':id')
  @RequirePermissions('productos:ver')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<HistorialPrecio> {
    return this.historialPrecioService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('productos:editar')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateHistorialPrecioDto
  ): Promise<HistorialPrecio> {
    return this.historialPrecioService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('productos:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.historialPrecioService.remove(id);
  }
}
