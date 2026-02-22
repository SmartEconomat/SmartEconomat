import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  Index,
  Check,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import type { Producto } from '../producto.entity/producto.entity';
import type { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import type { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import type { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import type { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';

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
@Unique(['producto', 'proveedor'])
@Entity({ name: 'producto_proveedor' })
@Index('idx_producto_proveedor_producto', ['producto'])
@Index('idx_producto_proveedor_proveedor', ['proveedor'])
@Check(`"precio_unitario" IS NULL OR "precio_unitario" >= 0`)
export class ProductoProveedor extends BaseEntity {
  /**
   * Referencia al Producto base.
   * Constraint: No se puede eliminar el producto si tiene proveedores vinculados (RESTRICT).
   */
  @ManyToOne('Producto', (producto: Producto) => producto.proveedores, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
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

  /**
   * Referencia al Proveedor.
   * Constraint: No se puede eliminar el proveedor si tiene productos vinculados (RESTRICT).
   */
  @ManyToOne('Proveedor', (proveedor: Proveedor) => proveedor.productos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor!: Relation<Proveedor>;

  /**
   * Relación con el inventario físico (stock) de este producto-proveedor.
   */
  @OneToMany(
    'Inventario',
    (inventario: Inventario) => inventario.productoProveedor
  )
  inventarios!: Relation<Inventario[]>;

  /**
   * Historial de variaciones de precio.
   */
  @OneToMany(
    'HistorialPrecio',
    (historial: HistorialPrecio) => historial.productoProveedor
  )
  historialPrecios!: Relation<HistorialPrecio[]>;

  /**
   * Pedidos realizados de este producto a este proveedor.
   */
  @OneToMany('PedidoProducto', (pp: PedidoProducto) => pp.productoProveedor)
  pedidoProductos!: Relation<PedidoProducto[]>;
}
