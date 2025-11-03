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
import { Recepcion } from '/recpcion/recepcion.entity';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { PedidoEntity } from '../pedido.entity/pedido.entity';

@Entity({ name: 'pedido_recepcion' })
export class PedidoRecepcion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido_recepcion' })
  id_pedido_recepcion: string;

  @Column({ type: 'uuid', name: 'id_pedido' })
  id_pedido: string;

  @Column({
    type: 'date',
    name: 'fecha_recepcion',
    default: () => 'CURRENT_DATE',
  })
  fecha_recepcion: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @ManyToOne(
    () => PedidoEntity,
    (pedido: PedidoEntity) =>
      pedido.pedidosRecepcion as unknown as PedidoRecepcion[]
  )
  @JoinColumn({ name: 'id_pedido' })
  pedido: PedidoEntity;

  @OneToMany(() => Recepcion, (recepcion) => recepcion.pedidoRecepcion)
  recepciones: Recepcion[];

  @ManyToMany(() => Albaran, (albaran) => albaran.pedidosRecepcion)
  @JoinTable({
    name: 'albaran_pedido_recepcion',
    joinColumn: {
      name: 'id_pedido_recepcion',
      referencedColumnName: 'id_pedido_recepcion',
    },
    inverseJoinColumn: {
      name: 'id_albaran',
      referencedColumnName: 'id_albaran',
    },
  })
  albaranes: Albaran[];
}
