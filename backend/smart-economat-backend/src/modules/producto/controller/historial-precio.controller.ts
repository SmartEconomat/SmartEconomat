import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HistorialPrecioService } from '../service/historial-precio.service';
import { CreateHistorialPrecioDto } from '../dto/historial-precio.dto/create-historial-precio.dto';
import { UpdateHistorialPrecioDto } from '../dto/historial-precio.dto/update-historial-precio.dto';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('historial-precio')
export class HistorialPrecioController {
  constructor(
    private readonly historialPrecioService: HistorialPrecioService
  ) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateHistorialPrecioDto): Promise<HistorialPrecio> {
    return this.historialPrecioService.create(dto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HistorialPrecio> {
    return this.historialPrecioService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHistorialPrecioDto
  ): Promise<HistorialPrecio> {
    return this.historialPrecioService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.historialPrecioService.remove(id);
  }
}
