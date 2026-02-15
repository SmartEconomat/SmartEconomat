import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Albaran } from '../albaran.entity/albaran.entity';

@Entity('albaran_pedido_recepcion')
export class AlbaranPedidoRecepcion {
  @PrimaryColumn('uuid', {
    name: 'id_albaran_pedido_recepcion',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

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

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
