import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { EstadoLote } from '../enums/receta.enums';

/**
 * Representa produccion lote en el sistema.
 */
@Entity('produccion_lote')
@Index(['recetaId'])
@Index(['usuarioId'])
@Index(['preparacionId'])
@Index(['fechaProduccion'])
@Check(
  'CHK_produccion_lote_producidas_step_05',
  `("porciones_producidas" * 2) = floor("porciones_producidas" * 2) AND "porciones_producidas" >= 0`
)
@Check(
  'CHK_produccion_lote_restantes_step_05',
  `("porciones_restantes" * 2) = floor("porciones_restantes" * 2) AND "porciones_restantes" >= 0`
)
export class ProduccionLote extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'receta_id' })
  recetaId!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ name: 'preparacion_id', nullable: true })
  preparacionId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Receta, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_producida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadProducida!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_produccion',
  })
  fechaProduccion!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_agotado',
  })
  fechaAgotado?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    name: 'coste_total_real',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotalReal!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'porciones_producidas',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  porcionesProducidas!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    name: 'porciones_restantes',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  porcionesRestantes!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: EstadoLote,
    default: EstadoLote.DISPONIBLE,
  })
  estado!: EstadoLote;
}
