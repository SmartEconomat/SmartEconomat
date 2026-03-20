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
 * Entidad ProductoProveedor
 *
 * Representa la relación entre un Producto y un Proveedor.
 * Almacena datos específicos del suministro, como el precio pactado,
 * el código de referencia interno del proveedor, y la marca específica si aplica.
 * Actúa como AGGREGATE ROOT para la gestión de stocks (Inventario) y precios (HistorialPrecio).
 *
 * @class ProductoProveedor
 * @extends {BaseEntity}
 */
@Unique(['productoId', 'proveedorId'])
@Entity({ name: 'producto_proveedor' })
@Index(['productoId'])
@Index(['proveedorId'])
@Check(`"precio_unitario" IS NULL OR "precio_unitario" >= 0`)
export class ProductoProveedor extends BaseEntity {
  @Column({ name: 'producto_id' })
  productoId!: string;

  @Column({ name: 'proveedor_id' })
  proveedorId!: string;

  /**
   * Referencia al Producto base.
   * Constraint: No se puede eliminar el producto si tiene proveedores vinculados (RESTRICT).
   */
  @ManyToOne(() => Producto, (producto) => producto.proveedores, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  /**
   * Marca específica que ofrece este proveedor para el producto.
   * Puede diferir de la marca genérica del producto base.
   * @type {string | undefined}
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  marca?: string;

  /**
   * Código de barras específico del proveedor.
   * @type {string | undefined}
   */
  @Column({
    type: 'varchar',
    length: 130,
    nullable: true,
    name: 'codigo_barras',
  })
  codigoBarras?: string;

  /**
   * Precio unitario actual pactado con el proveedor.
   * Constraint: Debe ser mayor o igual a 0.
   * @type {number | undefined}
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
   * Referencia al Proveedor.
   * Constraint: No se puede eliminar el proveedor si tiene productos vinculados (RESTRICT).
   */
  @ManyToOne(() => Proveedor, (proveedor) => proveedor.productos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor!: Relation<Proveedor>;

  /**
   * Relación con el inventario físico (stock) de este producto-proveedor.
   */
  @OneToMany(() => Inventario, (inventario) => inventario.productoProveedor)
  inventarios!: Relation<Inventario[]>;

  /**
   * Historial de variaciones de precio.
   */
  @OneToMany(() => HistorialPrecio, (historial) => historial.productoProveedor)
  historialPrecios!: Relation<HistorialPrecio[]>;

  /**
   * Pedidos realizados de este producto a este proveedor.
   */
  @OneToMany(() => PedidoProducto, (pp) => pp.productoProveedor)
  pedidoProductos!: Relation<PedidoProducto[]>;
}
