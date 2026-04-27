import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { PedidoUsuarioLinea } from '../pedido-usuario-linea.entity/pedido-usuario-linea.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'pedido_producto' })
@Index(['pedidoId'])
@Index(['productoProveedorId'])
@Index(['pedidoUsuarioLineaId'])
@Check(`"cantidad" > 0`)
@Check(`"precio_unitario" >= 0`)
export class PedidoProducto extends BaseEntity {
  /**
   * Documentación en español.
   */
  hasLinkedMovements?: boolean;

  /**
   * Documentación en español.
   */
  @Column({ name: 'pedido_id' })
  pedidoId!: string;

  /**
   * Documentación en español.
   */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * Documentación en español.
   */
  @Column({ name: 'pedido_usuario_linea_id', nullable: true })
  pedidoUsuarioLineaId?: string;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoProductos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Relation<Pedido>;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.pedidoProductos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  @ManyToOne(() => PedidoUsuarioLinea, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pedido_usuario_linea_id' })
  pedidoUsuarioLinea?: Relation<PedidoUsuarioLinea>;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    name: 'precio_unitario',
    transformer: new ColumnNumericTransformer(),
  })
  precioUnitario!: number;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  /* --- Métodos de Dominio --- */

  /**
   * Documentación en español.
   */
  get subtotal(): number {
    return Number(this.cantidad) * Number(this.precioUnitario);
  }
}
