import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

/**
 * Documentación en español.
 */
@Entity({ name: 'historial_precio' })
@Index(['productoProveedorId'])
@Index(['fecha'])
@Check(`"precio" > 0`)
export class HistorialPrecio extends BaseEntity {
  /**
   * Documentación en español.
   */
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * Documentación en español.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.historialPrecios, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: new ColumnNumericTransformer(),
  })
  precio!: number;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad?: number;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'documento_origen',
  })
  documentoOrigen?: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'recepcion_id',
  })
  recepcionId?: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;
}
