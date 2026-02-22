import { Entity, ManyToOne, JoinColumn, Index, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { Albaran } from '../albaran.entity/albaran.entity';
import type { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';

/**
 * AlbaranPedidoRecepcion Entity
 *
 * Tabla puente entre Albaran y RecepcionPedido
 */
@Entity('albaran_pedido_recepcion')
@Index('idx_albaran_pedido_recepcion_albaran', ['albaran'])
@Index('idx_albaran_pedido_recepcion_recepcion_pedido', ['recepcionPedido'])
export class AlbaranPedidoRecepcion extends BaseEntity {
  @ManyToOne('Albaran', (albaran: Albaran) => albaran.albaranPedidoRecepcion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_albaran' })
  albaran!: Relation<Albaran>;

  @ManyToOne('RecepcionPedido', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido_recepcion' })
  recepcionPedido!: Relation<RecepcionPedido>;
}
