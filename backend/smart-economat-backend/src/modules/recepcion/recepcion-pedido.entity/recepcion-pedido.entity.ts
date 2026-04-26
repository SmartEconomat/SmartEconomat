import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

/**
 * Documentación en español.
 */
@Unique(['recepcionId', 'pedidoId'])
@Entity({ name: 'recepcion_pedido' })
@Index(['recepcionId'])
@Index(['pedidoId'])
export class RecepcionPedido extends BaseEntity {
  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_id' })
  pedidoId!: string;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionesPedidos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

  @ManyToOne(() => Pedido, (pedido) => pedido.recepcionesPedido, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Relation<Pedido>;

  @Column({
    name: 'fecha_vinculacion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaVinculacion!: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.recepcionPedido)
  albaranPedidoRecepcion!: Relation<AlbaranPedidoRecepcion[]>;
}
