import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { Inventario } from '../inventario.entity/inventario.entity';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createInventarioDto: CreateInventarioItemDto
  ): Promise<Inventario> {
    return this.inventarioService.create(createInventarioDto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findAll(): Promise<Inventario[]> {
    return this.inventarioService.findAll();
  }

  @Get('alertas/caducidad')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  alertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    return this.inventarioService.obtenerAlertasCaducidad();
  }

  @Get('alertas/stock')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  alertasStock(): Promise<AlertaStockDTO[]> {
    return this.inventarioService.obtenerAlertasStock();
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(@Param('id') id: string): Promise<Inventario> {
    return this.inventarioService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto
  ): Promise<Inventario> {
    return this.inventarioService.update(id, updateInventarioDto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.inventarioService.remove(id);
  }
}
