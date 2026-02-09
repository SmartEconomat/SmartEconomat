// src/modules/productos/producto-proveedor.entity/producto-proveedor.entity.ts
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
  @PrimaryGeneratedColumn('uuid', { name: 'id_producto_proveedor' })
  id!: string;

  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'CASCADE', // ← ¡CORREGIDO!
  })
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto!: Producto;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor', referencedColumnName: 'id' })
  proveedor!: Proveedor;

  @Column({
    type: 'varchar',
    length: 130,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'precio_unitario',
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario?: number;

  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: PedidoProducto[];

  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Inventario[];

  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: HistorialPrecio[];
}
