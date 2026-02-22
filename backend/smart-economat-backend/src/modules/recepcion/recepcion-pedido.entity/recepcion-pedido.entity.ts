import type { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { Recepcion } from '../recepcion.entity/recepcion.entity';
import type { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

/**
 * RecepcionPedido Entity
 *
 * Tabla puente entre Recepcion y Pedido.
 */
@Unique(['recepcion', 'pedido'])
@Entity({ name: 'recepcion_pedido' })
@Index('idx_recepcion_pedido_recepcion', ['recepcion'])
@Index('idx_recepcion_pedido_pedido', ['pedido'])
export class RecepcionPedido extends BaseEntity {
  @ManyToOne(
    'Recepcion',
    (recepcion: Recepcion) => recepcion.recepcionesPedidos,
    {
      onDelete: 'RESTRICT',
      nullable: false,
    }
  )
  @JoinColumn({ name: 'id_recepcion', referencedColumnName: 'id' })
  recepcion!: Relation<Recepcion>;

  @ManyToOne('Pedido', (pedido: Pedido) => pedido.recepcionesPedido, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido!: Relation<Pedido>;

  @Column({
    name: 'fecha_vinculacion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaVinculacion!: Date;

  @OneToMany(
    'AlbaranPedidoRecepcion',
    (apr: AlbaranPedidoRecepcion) => apr.recepcionPedido
  )
  albaranPedidoRecepcion!: Relation<AlbaranPedidoRecepcion[]>;
}
