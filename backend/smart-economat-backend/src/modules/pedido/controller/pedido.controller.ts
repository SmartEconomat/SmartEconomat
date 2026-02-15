import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { PedidoService } from '../service/pedido.service';

@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Patch(':id/fecha-entrega')
  updateFechaEntrega(@Param('id') id: string, @Body() dto: UpdatePedidoDto) {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  @Patch(':id/cancelar')
  cancelarPedido(@Param('id') id: string, @Body() dto: CancelPedidoDto) {
    return this.pedidoService.cancelarPedido(id, dto);
  }
}
