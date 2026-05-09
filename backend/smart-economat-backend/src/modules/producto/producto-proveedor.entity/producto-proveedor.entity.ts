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
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

/**
 * Representa producto proveedor en el sistema.
 */
@Unique(['productoId', 'proveedorId'])
@Entity({ name: 'producto_proveedor' })
@Index(['productoId'])
@Index(['proveedorId'])
@Check(`"precio_unitario" IS NULL OR "precio_unitario" > 0`)
export class ProductoProveedor extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'producto_id' })
  productoId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'proveedor_id' })
  proveedorId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'marca', type: 'varchar', length: 150, nullable: true })
  marca?: string | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    name: 'codigo_barras',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  codigoBarras?: string | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor!: Relation<Proveedor>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Relation<Inventario[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: Relation<HistorialPrecio[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: Relation<PedidoProducto[]>;

  /**
   * Devuelve el código de barras efectivo (específico o heredado del producto).
   */
  @Expose()
  get effectiveBarcode(): string | undefined {
    return this.codigoBarras || this.producto?.codigoBarras;
  }
}
