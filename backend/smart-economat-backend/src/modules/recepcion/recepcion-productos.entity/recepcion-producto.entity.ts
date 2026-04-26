import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';

/**
 * Documentación en español.
 */
@Entity({ name: 'recepcion_producto' })
@Index(['recepcionId'])
@Index(['pedidoProductoId'])
@Index(['incidenciaId'])
@Check(`"cantidad_recibida" >= 0`)
export class RecepcionProducto extends BaseEntity {
  @Column({ name: 'recepcion_id' })
  recepcionId!: string;

  @Column({ name: 'pedido_producto_id' })
  pedidoProductoId!: string;

  @Column({ name: 'incidencia_id', nullable: true })
  incidenciaId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Recepcion, (recepcion) => recepcion.recepcionProductos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'recepcion_id' })
  recepcion!: Relation<Recepcion>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PedidoProducto, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_producto_id' })
  pedidoProducto!: Relation<PedidoProducto>;

  @OneToOne(() => Incidencia, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'incidencia_id' })
  incidencia?: Relation<Incidencia>;

        /**
     * Documentación en español.
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
    name: 'estado_producto',
    type: 'enum',
    enum: EstadoProductoRecepcion,
    default: EstadoProductoRecepcion.PERFECTO,
  })
  estadoProducto!: EstadoProductoRecepcion;

  @Column({
    name: 'fecha_recepcion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRecepcion!: Date;

  @Column({ name: 'is_weighed_with_scale', type: 'boolean', default: false })
  isWeighedWithScale!: boolean;
}
