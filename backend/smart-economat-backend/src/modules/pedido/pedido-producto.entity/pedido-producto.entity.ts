import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';

/**
 * Entidad PedidoProducto
 *
 * Representa una línea de detalle dentro de un pedido.
 * Vincula un ProductoProveedor específico con la cantidad y precio en el momento de la compra.
 * Mantiene el histórico de precios (precioUnitario) aunque el proveedor cambie sus tarifas luego.
 *
 * @class PedidoProducto
 * @extends {BaseEntity}
 */
@Entity({ name: 'pedido_producto' })
@Index('idx_pedido_producto_pedido', ['pedido'])
@Index('idx_pedido_producto_producto_proveedor', ['productoProveedor'])
@Check(`"cantidad" > 0`)
@Check(`"precio_unitario" >= 0`)
export class PedidoProducto extends BaseEntity {
  /**
   * Pedido al que pertenece esta línea.
   * Constraint: RESTRICT para mantener el histórico de compras.
   */
  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoProductos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido!: Pedido;

  /**
   * ProductoProveedor solicitado.
   * Identifica unívocamente producto + proveedor.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.pedidoProductos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  /**
   * Cantidad solicitada.
   * Constraint: Debe ser mayor a 0 (CHECK > 0).
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
   * Precio unitario acordado en el momento del pedido.
   * Se congela al crear el pedido para no verse afectado por cambios futuros de tarifas.
   * Constraint: >= 0.
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

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  /* --- Métodos de Dominio --- */

  /**
   * Calcular subtotal (cantidad * precio)
   */
  get subtotal(): number {
    return Number(this.cantidad) * Number(this.precioUnitario);
  }
}
