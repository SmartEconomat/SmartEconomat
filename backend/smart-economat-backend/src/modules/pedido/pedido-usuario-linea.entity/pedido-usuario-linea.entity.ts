import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'pedido_usuario_linea' })
@Index(['pedidoUsuarioId'])
@Index(['productoProveedorId'])
@Check(`"cantidad" > 0`)
@Check(`"precio_unitario" >= 0`)
export class PedidoUsuarioLinea extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'pedido_usuario_id' })
  pedidoUsuarioId!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PedidoUsuario, (pedidoUsuario) => pedidoUsuario.lineas, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario!: Relation<PedidoUsuario>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => ProductoProveedor, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

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
}
