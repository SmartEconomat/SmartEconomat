import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PedidoEntity } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';

@Entity('pedido_productos')
export class PedidoProductoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido_producto' })
  id: string;

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido: PedidoEntity;

  @ManyToOne(() => ProductoProveedor, { nullable: false })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor: ProductoProveedor;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  precio_unitario: number;
}
