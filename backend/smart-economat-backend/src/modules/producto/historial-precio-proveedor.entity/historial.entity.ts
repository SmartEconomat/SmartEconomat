import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
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
@Index(['productoProveedorId'])
@Index(['fecha'])
@Check(`"precio" > 0`)
export class HistorialPrecio extends BaseEntity {
  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  /**
   * ProductoProveedor al que pertenece este histórico.
   * La relación es CASCADE deletion porque es un dato dependiente fuerte.
   */
  @ManyToOne(() => ProductoProveedor, (pp) => pp.historialPrecios, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  /**
   * Precio registrado en ese momento histórico.
   * Constraint: > 0.
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
   * Cantidad asociada a este registro histórico.
   * Representa la cantidad que se recibió al precio unitario especificado.
   * @type {number}
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
   * Identificador del documento de origen (Nº Albarán, etc.) que generó esta entrada.
   * @type {string | undefined}
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'documento_origen',
  })
  documentoOrigen?: string;

  /**
   * Identificador de la recepción asociada que generó este cambio.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'recepcion_id',
  })
  recepcionId?: string;

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
