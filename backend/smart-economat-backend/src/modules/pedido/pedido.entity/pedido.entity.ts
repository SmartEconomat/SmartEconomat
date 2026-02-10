// src/modules/pedidos/pedido.entity/pedido.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';

@Entity({ name: 'pedido' })
export class Pedido {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido' })
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: Usuario;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_pedido',
  })
  fechaPedido!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'fecha_entrega' })
  fechaEntrega?: Date;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'coste_total',
  })
  costeTotal!: number;

  @Column({ type: 'enum', enum: EstadoPedido, default: EstadoPedido.PENDIENTE })
  estado!: EstadoPedido;

  @OneToMany(() => PedidoProducto, (pp) => pp.pedido, { cascade: true })
  pedidoProductos!: PedidoProducto[];

  @OneToMany(() => RecepcionPedido, (rp) => rp.pedido)
  recepcionesPedido!: RecepcionPedido[];
}
