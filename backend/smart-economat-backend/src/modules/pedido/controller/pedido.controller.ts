import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { PedidoService } from '../service/pedido.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Patch(':id/fecha-entrega')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  updateFechaEntrega(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePedidoDto
  ) {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  @Patch(':id/cancelar')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  cancelarPedido(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPedidoDto
  ) {
    return this.pedidoService.cancelarPedido(id, dto);
  }
}
