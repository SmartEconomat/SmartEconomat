import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MovimientoService } from '../service/movimiento.service';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findAll() {
    return this.movimientoService.findAll();
  }

  @Get('historial')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  getMovimientoHistory(@Query() dto: MovimientoHistoryDto) {
    return this.movimientoService.getMovimientoHistory(dto);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovimientoDto
  ) {
    return this.movimientoService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.remove(id);
  }
}
