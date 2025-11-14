import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';

@Entity('pedido_productos')
export class PedidoProducto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido_producto' })
  id!: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido!: Pedido;

  @ManyToOne(() => ProductoProveedor, { nullable: false })
  @JoinColumn({
    name: 'id_producto_proveedor',
    referencedColumnName: 'id',
  })
  productoProveedor!: ProductoProveedor;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  cantidad!: number;

  @Column({ type: 'numeric', nullable: false, precision: 10, scale: 2 })
  precio_unitario!: number;
}
