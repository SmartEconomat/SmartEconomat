import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { PedidoRecepcion } from '../pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'albaran' })
export class Albaran {
  @PrimaryGeneratedColumn('uuid', { name: 'id_albaran' })
  id_albaran: string;

  @Column({ type: 'varchar', length: 50 })
  n_albaran: string;

  @Column({ type: 'boolean', nullable: true })
  concordancia: boolean;

  @Column({ type: 'date', nullable: true })
  fecha: Date;

  @ManyToMany(
    () => PedidoRecepcion,
    (pedidoRecepcion) => pedidoRecepcion.albaranes
  )
  pedidosRecepcion: PedidoRecepcion[];
}
