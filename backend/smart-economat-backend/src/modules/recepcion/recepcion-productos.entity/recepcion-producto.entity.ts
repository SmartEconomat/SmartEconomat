import { PedidoProducto } from '../../pedidos/pedido-producto.entity/pedido-producto.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
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
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaRecepcion!: Date;
}
