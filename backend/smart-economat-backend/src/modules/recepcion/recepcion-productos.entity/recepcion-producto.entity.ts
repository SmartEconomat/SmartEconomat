import { PedidoProducto } from 'src/modules/pedidos/pedido-producto.entity/pedido-producto.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
@Entity('recepcion_producto')
@Unique(['recepcion', 'pedidoProducto'])
export class RecepcionProducto {
  @PrimaryGeneratedColumn({ name: 'id_recepcion_producto' })
  id!: number;

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
