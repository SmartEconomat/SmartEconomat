import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';

@Injectable()
export class PedidoService {
  private pedidos: Pedido[] = [];

  private getPedidoValidandoEstado(id: string): Pedido {
    const pedido = this.pedidos.find((p) => p.id === id);

    if (!pedido) {
      throw new NotFoundException(`Pedido no encontrado`);
    }

    if (
      pedido.estado === EstadoPedido.RECIBIDO ||
      pedido.estado === EstadoPedido.EN_PROCESO
    ) {
      throw new BadRequestException(
        `No se puede cancelar un pedido que ya ha sido recibido o está en proceso de envio`
      );
    }
    return pedido;
  }

  updateFechaEntrega(id: string, dto: UpdatePedidoDto): Pedido {
    const pedido = this.getPedidoValidandoEstado(id);
    pedido.fechaEntrega = new Date(dto.fechaEntrega);
    return pedido;
  }

  cancelarPedido(id: string, dto: CancelPedidoDto): Pedido {
    const pedido = this.getPedidoValidandoEstado(id);
    pedido.estado = EstadoPedido.CANCELADO;
    pedido.motivoCancelacion = dto.motivoCancelacion;
    return pedido;
  }
}
