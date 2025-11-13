import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { RecepcionPedido } from 'src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';

@Entity({ name: 'pedido' })
export class Pedido {
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

  @OneToMany(() => PedidoProducto, (pp) => pp.pedido)
  productos: PedidoProducto[];

  @OneToMany(() => RecepcionPedido, (rp) => rp.pedido)
  recepcionesPedido: RecepcionPedido[];
}
