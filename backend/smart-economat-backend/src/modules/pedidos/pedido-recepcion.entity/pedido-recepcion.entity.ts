import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { PedidoEntity } from '../pedido.entity/pedido.entity';

@Entity({ name: 'pedido_recepcion' })
export class PedidoRecepcion {
  @PrimaryGeneratedColumn('uuid')
  id_pedido_recepcion: string;

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.pedidosRecepcion)
  @JoinColumn({ name: 'id_pedido' })
  pedido: PedidoEntity;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha_recepcion: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => Recepcion, (recepcion) => recepcion.pedidoRecepcion)
  recepciones: Recepcion[];

  @ManyToMany(() => Albaran, (albaran) => albaran.pedidosRecepcion)
  @JoinTable({
    name: 'albaran_pedido_recepcion',
  })
  albaranes: Albaran[];
}
