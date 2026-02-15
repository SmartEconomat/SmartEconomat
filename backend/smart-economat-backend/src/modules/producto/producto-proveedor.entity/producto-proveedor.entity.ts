import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { PedidoProducto } from '../../pedidos/pedido-producto.entity/pedido-producto.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

@Unique(['producto', 'proveedor'])
@Entity({ name: 'producto_proveedor' })
export class ProductoProveedor {
  @PrimaryColumn('uuid', {
    name: 'id_producto_proveedor',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto!: Producto;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

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

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor!: Proveedor;

  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Inventario[];

  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: HistorialPrecio[];

  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: PedidoProducto[];

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
  })
  deletedAt?: Date;
}
