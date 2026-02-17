import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

/**
 * Entidad HistorialPrecio
 *
 * Mantiene un registro histórico de los cambios de precio de un ProductoProveedor.
 * Permite analizar la evolución de costes y auditar cambios.
 * Se debe crear un nuevo registro cada vez que cambia 'precioUnitario' en ProductoProveedor.
 *
 * @class HistorialPrecio
 * @extends {BaseEntity}
 */
@Entity({ name: 'historial_precio' })
@Index('idx_historial_precio_producto_proveedor', ['productoProveedor'])
@Index('idx_historial_precio_fecha', ['fecha'])
@Check(`"precio" >= 0`)
export class HistorialPrecio extends BaseEntity {
  /**
   * ProductoProveedor al que pertenece este histórico.
   * La relación es CASCADE deletion porque es un dato dependiente fuerte.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.historialPrecios, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  /**
   * Precio registrado en ese momento histórico.
   * Constraint: >= 0.
   * @type {number}
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
   * Fecha en la que se registró (o entró en vigor) este precio.
   * @type {Date}
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;
}
