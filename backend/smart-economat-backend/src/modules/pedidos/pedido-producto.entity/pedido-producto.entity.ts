import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PedidoEntity } from '../pedido.entity/pedido.entity';

@Entity('pedido_productos')
export class PedidoProductoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido_producto' })
  id: string;

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido: PedidoEntity;

  @Column('uuid', { nullable: false })
  id_producto_proveedor: string;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  precio_unitario: number;
}
