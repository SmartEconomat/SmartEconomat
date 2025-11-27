import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';

@Entity('albaran_pedido_recepcion')
export class AlbaranPedidoRecepcion {
  @PrimaryGeneratedColumn({ name: 'id_albaran_pedido_recepcion' })
  id!: number;

  @ManyToOne(() => Albaran, (albaran) => albaran.albaranPedidoRecepcion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_albaran' })
  albaran!: Albaran;

  @ManyToOne(() => RecepcionPedido, (rp) => rp.albaranPedidoRecepcion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido_recepcion' })
  recepcionPedido!: RecepcionPedido;
}
