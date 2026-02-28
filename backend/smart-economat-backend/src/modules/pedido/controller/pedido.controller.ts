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
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoService } from '../service/pedido.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePedidoDto): Promise<Pedido> {
    return this.pedidoService.create(dto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findAll(): Promise<Pedido[]> {
    return this.pedidoService.findAll();
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Pedido> {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePedidoDto): Promise<Pedido> {
    return this.pedidoService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pedidoService.remove(id);
  }

  @Patch(':id/fecha-entrega')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  updateFechaEntrega(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePedidoDto): Promise<Pedido> {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  @Patch(':id/cancelar')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  cancelarPedido(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelPedidoDto): Promise<Pedido> {
    return this.pedidoService.cancelarPedido(id, dto);
  }

}
