import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';

/**
 * Represents a product line within a user-initiated order (PedidoUsuario),
 * stored in the `pedido_usuario_linea` table.
 * Each line records the product-supplier, requested quantity, and agreed price.
 *
 * @class PedidoUsuarioLinea
 * @extends {BaseEntity}
 */
@Entity({ name: 'pedido_usuario_linea' })
@Index(['pedidoUsuarioId'])
@Index(['productoProveedorId'])
@Check(`"cantidad" > 0`)
@Check(`"precio_unitario" >= 0`)
export class PedidoUsuarioLinea extends BaseEntity {
  /** Foreign key referencing the parent PedidoUsuario. */
  @Column({ name: 'pedido_usuario_id' })
  pedidoUsuarioId!: string;

  /** Foreign key referencing the ProductoProveedor requested in this line. */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * Parent user order. ON DELETE CASCADE removes lines when the order is deleted.
   */
  @ManyToOne(() => PedidoUsuario, (pedidoUsuario) => pedidoUsuario.lineas, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario!: Relation<PedidoUsuario>;

  /**
   * Product-supplier combination requested.
   * ON DELETE RESTRICT prevents removing a product-supplier that is referenced in a user order.
   */
  @ManyToOne(() => ProductoProveedor, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  /**
   * Quantity requested. Constraint: must be greater than 0 (CHECK > 0).
   * @type {number}
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /**
   * Unit price at the time of the request. Constraint: >= 0.
   * @type {number}
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    name: 'precio_unitario',
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario!: number;

  /** Optional free-text observations for this line. */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
