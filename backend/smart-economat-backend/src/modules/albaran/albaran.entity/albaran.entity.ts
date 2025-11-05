import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { PedidoRecepcion } from 'src/modules/pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'albaran' })
export class Albaran {
  @PrimaryGeneratedColumn('uuid')
  id_albaran: string;

  @Column({ type: 'varchar', length: 50 })
  n_albaran: string;

  @Column({ type: 'boolean', default: false })
  concordancia: boolean;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;

  @ManyToMany(
    () => PedidoRecepcion,
    (pedidoRecepcion) => pedidoRecepcion.albaranes
  )
  pedidosRecepcion: PedidoRecepcion[];
}
