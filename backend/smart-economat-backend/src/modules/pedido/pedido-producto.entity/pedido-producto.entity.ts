import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Pedido } from '../pedido.entity/pedido.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { PedidoUsuarioLinea } from '../pedido-usuario-linea.entity/pedido-usuario-linea.entity';

/**
 * Representa pedido producto en el sistema.
 */
@Entity({ name: 'pedido_producto' })
@Index(['pedidoId'])
@Index(['productoProveedorId'])
@Index(['pedidoUsuarioLineaId'])
@Check(`"cantidad" > 0`)
@Check(`"precio_unitario" >= 0`)
export class PedidoProducto extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  hasLinkedMovements?: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'pedido_id' })
  pedidoId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'pedido_usuario_linea_id', nullable: true })
  pedidoUsuarioLineaId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoProductos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Relation<Pedido>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  /* --- Métodos de Dominio --- */

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  get subtotal(): number {
    return Number(this.cantidad) * Number(this.precioUnitario);
  }
}
