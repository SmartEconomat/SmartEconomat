import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PedidoRecepcion } from 'src/modules/pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'recepcion' })
export class Recepcion {
  @PrimaryGeneratedColumn('uuid')
  id_recepcion: string;

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

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha_recepcion: Date;

  @ManyToOne(
    () => PedidoRecepcion,
    (pedidoRecepcion) => pedidoRecepcion.recepciones
  )
  @JoinColumn({ name: 'id_pedido_recepcion' })
  pedidoRecepcion: PedidoRecepcion;
}
