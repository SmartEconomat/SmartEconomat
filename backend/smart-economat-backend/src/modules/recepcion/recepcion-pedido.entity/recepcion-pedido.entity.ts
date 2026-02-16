import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

@Entity('recepcion_pedido')
@Unique(['recepcion', 'pedido'])
export class RecepcionPedido {
  @PrimaryColumn('uuid', {
    name: 'id_recepcion_pedido',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionesPedido, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_recepcion' })
  recepcion!: Recepcion;

  @ManyToOne(() => Pedido, (pedido) => pedido.recepcionesPedido, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido!: Pedido;
  @Column({
    name: 'fecha_vinculacion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaVinculacion!: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.recepcionPedido)
  albaranPedidoRecepcion!: AlbaranPedidoRecepcion[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;
}
