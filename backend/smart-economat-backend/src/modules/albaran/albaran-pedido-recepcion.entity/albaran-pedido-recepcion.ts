import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';
import { PedidoRecepcion } from 'src/modules/pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'albaran_pedido_recepcion' })
export class AlbaranPedidoRecepcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Albaran)
  @JoinColumn({ name: 'id_albaran' })
  albaran: Albaran;

  @ManyToOne(() => PedidoRecepcion)
  @JoinColumn({ name: 'id_pedido_recepcion' })
  pedidoRecepcion: PedidoRecepcion;
}
