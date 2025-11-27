import { Pedido } from '../../pedidos/pedido.entity/pedido.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

@Entity('recepcion_pedido')
@Unique(['recepcion', 'pedido'])
export class RecepcionPedido {
  @PrimaryGeneratedColumn({ name: 'id_recepcion_pedido' })
  id!: number;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionesPedido, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_recepcion' })
  recepcion!: Recepcion;

  @ManyToOne(() => Pedido, (pedido) => pedido.recepcionesPedido, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido!: Pedido;

  @Column({
    name: 'fecha_vinculacion',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaVinculacion!: Date;

  @OneToMany(() => AlbaranPedidoRecepcion, (apr) => apr.recepcionPedido)
  albaranPedidoRecepcion!: AlbaranPedidoRecepcion[];
}
