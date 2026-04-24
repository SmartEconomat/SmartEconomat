import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { EstadoLote } from '../enums/receta.enums';

/**
 * Represents a production batch (lote de producción) stored in the `produccion_lote` table.
 * Records the result of executing a recipe: the quantity produced, real cost, portions,
 * expiry date, and lifecycle state (DISPONIBLE / AGOTADO).
 *
 * @class ProduccionLote
 * @extends {BaseEntity}
 */
@Entity('produccion_lote')
@Index(['recetaId'])
@Index(['usuarioId'])
@Index(['preparacionId'])
@Index(['fechaProduccion'])
export class ProduccionLote extends BaseEntity {
  /** Foreign key referencing the Recipe that was executed. */
  @Column({ name: 'receta_id' })
  recetaId!: string;

  /** Foreign key referencing the User who triggered the production. Nullable (SET NULL on delete). */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /** Foreign key referencing an associated Preparacion session, if any. */
  @Column({ name: 'preparacion_id', nullable: true })
  preparacionId?: string;

  /**
   * Recipe executed to create this batch.
   * ON DELETE RESTRICT prevents deleting a recipe that has production history.
   */
  @ManyToOne(() => Receta, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  /**
   * User who executed the production.
   * ON DELETE SET NULL preserves history even if the user is removed.
   */
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /** Total quantity produced in this batch, expressed in the recipe's `unidadResultado`. */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_producida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadProducida!: number;

  /** Timestamp when the batch was produced. Defaults to the current time. */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_produccion',
  })
  fechaProduccion!: Date;

  /**
   * Expiry date of this production batch.
   * Derived from `fechaProduccion + diasCaducidad` of the recipe, or set manually.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

  /** Timestamp when the batch stock reached zero (estado changed to AGOTADO). */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_agotado',
  })
  fechaAgotado?: Date | null;

  /**
   * Actual total cost of the batch, calculated from the real ingredient prices
   * at the time of production.
   */
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    name: 'coste_total_real',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotalReal!: number;

  /** Total number of portions produced (cantidadProducida / tamanioRacion). */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'porciones_producidas',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  porcionesProducidas!: number;

  /** Remaining portions available for consumption. Decremented by `ConsumirProduccion`. */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    name: 'porciones_restantes',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  porcionesRestantes!: number;

  /** Current lifecycle state of the batch (DISPONIBLE while portions remain, AGOTADO when exhausted). */
  @Column({
    type: 'enum',
    enum: EstadoLote,
    default: EstadoLote.DISPONIBLE,
  })
  estado!: EstadoLote;
}
