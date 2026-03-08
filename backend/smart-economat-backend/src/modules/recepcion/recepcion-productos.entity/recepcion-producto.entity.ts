import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';

/**
 * Entidad RecepcionProducto
 *
 * Detalle de productos recibidos en una recepción.
 * Vincula la recepción con la línea de pedido original para cotejar lo pedido vs recibido.
 *
 * @class RecepcionProducto
 * @extends {BaseEntity}
 */
@Entity({ name: 'recepcion_producto' })
@Index(['recepcionId'])
@Index(['pedidoProductoId'])
@Check(`"cantidad_recibida" >= 0`)
export class RecepcionProducto extends BaseEntity {
  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_producto_id' })
  pedidoProductoId!: string;

  /**
   * Recepción a la que pertenece este detalle.
   * CASCADE onDelete para borrar los detalles si se borra la cabecera.
   */
  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionProductos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

  /**
   * Línea de pedido original que se está recibiendo.
   * Permite calcular diferencias (pedido - recibido).
   */
  @ManyToOne(() => PedidoProducto, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_producto_id' })
  pedidoProducto!: Relation<PedidoProducto>;

  /**
   * Cantidad realmente recibida.
   * Constraint: >= 0.
   * @type {number}
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_recibida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadRecibida!: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({
    name: 'fecha_recepcion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRecepcion!: Date;
}
