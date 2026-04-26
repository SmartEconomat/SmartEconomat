import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  Index,
  Check,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

/**
 * Documentación en español.
 */
@Unique(['productoId', 'proveedorId'])
@Entity({ name: 'producto_proveedor' })
@Index(['productoId'])
@Index(['proveedorId'])
@Check(`"precio_unitario" IS NULL OR "precio_unitario" > 0`)
export class ProductoProveedor extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'producto_id' })
  productoId!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'proveedor_id' })
  proveedorId!: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'varchar',
    length: 130,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'precio_unitario',
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario?: number;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'merma_esperada',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  mermaEsperada?: number;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 4,
    default: 0,
    name: 'pmp',
    transformer: new ColumnNumericTransformer(),
  })
  pmp!: number;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor!: Relation<Proveedor>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Relation<Inventario[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: Relation<HistorialPrecio[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: Relation<PedidoProducto[]>;
}
