import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';
import { RecepcionProducto } from 'src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';

@Entity('pedido_producto')
@Unique(['pedido', 'productoProveedor'])
export class PedidoProducto {
  @PrimaryGeneratedColumn({ name: 'id_pedido_producto' })
  idPedidoProducto: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido: Pedido;

  @ManyToOne(
    () => ProductoProveedor,
    (productoProveedor) => productoProveedor.pedidos,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor: ProductoProveedor;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(
    () => RecepcionProducto,
    (recepcionProducto) => recepcionProducto.pedidoProducto
  )
  recepcionesProducto: RecepcionProducto[];
}
