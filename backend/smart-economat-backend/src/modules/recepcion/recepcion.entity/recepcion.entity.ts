import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PedidoRecepcion } from '../pedidos-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'recepcion' })
export class Recepcion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_recepcion' })
  id: string;

  @Column({ type: 'uuid', name: 'id_pedido_recepcion' })
  id_pedido_recepcion: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'varchar', length: 50 })
  unidad: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  calidad?: string;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @Column({
    type: 'date',
    name: 'fecha_recepcion',
    default: () => 'CURRENT_DATE',
  })
  fecha_recepcion: Date;

  @ManyToOne(() => PedidoRecepcion, (pedido) => pedido.recepciones)
  pedidoRecepcion: PedidoRecepcion;
}
