import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { PedidoProducto } from '../../pedidos/pedido-producto.entity/pedido-producto.entity';
import { Inventario } from 'src/modules/inventario/inventario.entity/inventario.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

@Unique(['producto', 'proveedor'])
@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  // --- CAMPOS ---
  // id_producto_proveedor
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto_proveedor' })
  id!: string;

  // marca
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  // codigo_barras
  @Column({
    type: 'varchar',
    length: 130,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;
  // precio_unitario
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'precio_unitario',
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario?: number;

  // --- RALACIONES MANY TO ONE ---

  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor!: Proveedor;

  // --- RELACIONES ONE TO MANY ---

  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Inventario[];

  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: HistorialPrecio[];

  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: PedidoProducto[];
}
