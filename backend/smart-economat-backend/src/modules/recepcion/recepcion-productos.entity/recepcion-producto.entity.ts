import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
@Entity('recepcion_producto')
@Unique(['recepcion', 'pedidoProducto'])
export class RecepcionProducto {
  @PrimaryColumn('uuid', {
    name: 'id_recepcion_producto',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionesProducto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_recepcion' })
  recepcion!: Recepcion;

  @ManyToOne(() => PedidoProducto, (pp) => pp.recepcionesProducto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido_producto' })
  pedidoProducto!: PedidoProducto;

  @Column({ name: 'cantidad_recibida', type: 'int' })
  cantidadRecibida!: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({
    name: 'fecha_recepcion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRecepcion!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;
}
