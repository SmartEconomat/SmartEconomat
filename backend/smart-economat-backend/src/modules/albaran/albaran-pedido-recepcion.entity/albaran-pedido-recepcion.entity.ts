import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Albaran } from '../albaran.entity/albaran.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';

/**
 * Documentación en español.
 */
@Entity('albaran_pedido_recepcion')
@Index(['albaranId'])
@Index(['recepcionPedidoId'])
export class AlbaranPedidoRecepcion extends BaseEntity {
  @Column({ name: 'albaran_id' })
  albaranId!: string;

  @Column({ name: 'recepcion_pedido_id' })
  recepcionPedidoId!: string;

  @ManyToOne(() => Albaran, (albaran) => albaran.albaranPedidoRecepcion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'albaran_id' })
  albaran!: Relation<Albaran>;

  @ManyToOne(() => RecepcionPedido, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recepcion_pedido_id' })
  recepcionPedido!: Relation<RecepcionPedido>;
}
