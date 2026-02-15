import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class PedidoService {
  private pedidos: Pedido[] = [];

  private getPedidoValidandoEstado(id: string): Pedido {
    const pedido = this.pedidos.find((p) => p.id === id);

    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    if (
      pedido.estado === EstadoPedido.RECIBIDO ||
      pedido.estado === EstadoPedido.EN_PROCESO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_NOT_CANCELLABLE')
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
