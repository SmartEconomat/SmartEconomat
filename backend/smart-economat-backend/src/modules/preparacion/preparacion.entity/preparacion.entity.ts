import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PreparacionEstado } from '../enums/preparacion.enums';

/**
 * Represents a kitchen preparation order stored in the `preparacion` table.
 *
 * A Preparacion links a Recipe to a scheduled or in-progress production run.
 * It follows a linear state machine:
 *   PENDIENTE → EN_PROCESO → COMPLETADA
 * and can be cancelled (→ CANCELADA) at any point before completion.
 * Finalising a preparation triggers the production pipeline in
 * {@link ProduccionService}, which consumes inventory and creates a
 * {@link ProduccionLote}.
 *
 * @class Preparacion
 * @extends {BaseEntity}
 */
@Entity('preparacion')
export class Preparacion extends BaseEntity {
  /** Foreign key referencing the Recipe to be prepared. */
  @Column({ name: 'receta_id' })
  recetaId!: string;

  /** Foreign key referencing the User responsible for the preparation. Nullable (SET NULL on delete). */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  /**
   * Foreign key referencing the target storage location for the produced batch.
   * Can be overridden at finalisation time by `finalizarPreparacion`.
   */
  @Column({ name: 'ubicacion_destino_id', nullable: true })
  ubicacionDestinoId?: string;

  /**
   * Recipe associated with this preparation.
   * ON DELETE RESTRICT prevents deleting a recipe that has pending preparations.
   */
  @ManyToOne(() => Receta, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  /**
   * User who created or is responsible for this preparation.
   * ON DELETE SET NULL preserves the preparation history even if the user is removed.
   */
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  /**
   * Quantity to produce, expressed in the recipe's `unidadResultado`.
   * Used by `ProduccionService.ejecutarProduccion` when the preparation is finalised.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_a_producir',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadAProducir!: number;

  /**
   * Current lifecycle state of the preparation.
   * Defaults to PENDIENTE on creation.
   * Valid transitions: PENDIENTE → EN_PROCESO → COMPLETADA | CANCELADA.
   */
  @Column({
    type: 'enum',
    enum: PreparacionEstado,
    default: PreparacionEstado.PENDIENTE,
  })
  estado!: PreparacionEstado;

  /** Optional timestamp for when the preparation is scheduled to start. */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_programada',
  })
  fechaProgramada?: Date | null;

  /** Timestamp recorded when the preparation transitions to EN_PROCESO. */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_inicio',
  })
  fechaInicio?: Date | null;

  /** Timestamp recorded when the preparation transitions to COMPLETADA. */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_finalizacion',
  })
  fechaFinalizacion?: Date | null;

  /** Free-text notes for this preparation (e.g. special instructions, issues encountered). */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
