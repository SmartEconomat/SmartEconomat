import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoRecepcion } from '../pedido-recepcion.entity/pedido-recepcion.entity';

@Entity({ name: 'pedido' })
export class PedidoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido' })
  id!: string;

  @Column('uuid', { nullable: false })
  id_usuario!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha_pedido!: Date;

  @Column({ type: 'timestamptz' })
  fecha_entrega!: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  coste_total!: number;

  @Column({ type: 'enum', enum: EstadoPedido, default: EstadoPedido.PENDIENTE })
  estado!: EstadoPedido;

  @OneToMany(() => PedidoRecepcion, (pr) => pr.pedido)
  pedidosRecepcion!: PedidoRecepcion[];
}
