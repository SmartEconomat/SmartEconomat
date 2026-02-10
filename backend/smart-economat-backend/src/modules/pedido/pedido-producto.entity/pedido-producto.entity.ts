import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';

@Entity('pedido_productos')
export class PedidoProducto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_pedido_producto' })
  id!: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoProductos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido!: Pedido;

  @ManyToOne(() => ProductoProveedor, { nullable: false })
  @JoinColumn({ name: 'id_producto_proveedor', referencedColumnName: 'id' })
  productoProveedor!: ProductoProveedor;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: false })
  cantidad!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: false })
  precio_unitario!: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => RecepcionProducto, (rp) => rp.pedidoProducto)
  recepcionesProducto!: RecepcionProducto[];
}
