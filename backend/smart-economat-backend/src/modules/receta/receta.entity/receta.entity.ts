import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { DificultadReceta, UnidadIngrediente } from '../enums/receta.enums';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

/**
 * Represents a Recipe (Receta) entity stored in the `receta` table.
 * A recipe defines the preparation instructions, ingredients, and production
 * parameters (yield, portion size, cost) for a dish or elaborated product.
 *
 * @class Receta
 * @extends {BaseEntity}
 */
@Index(['dificultad', 'tiempoEstimadoMinutos'])
@Entity('receta')
export class Receta extends BaseEntity {
  /** Name of the recipe. Maximum 150 characters. */
  @Column({ length: 150 })
  nombre!: string;

  /** Step-by-step preparation instructions (free text). */
  @Column('text')
  instrucciones!: string;

  /** Estimated preparation time in minutes. */
  @Column({
    type: 'integer',
    name: 'tiempo_estimado_minutos',
    default: 0,
  })
  tiempoEstimadoMinutos!: number;

  /** Difficulty level of the recipe (FACIL, MEDIA, DIFICIL). */
  @Column({
    type: 'enum',
    enum: DificultadReceta,
    enumName: 'dificultad_receta_enum',
  })
  dificultad!: DificultadReceta;

  /** Relative path or URL of the recipe image (original). */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'path_img' })
  pathImg?: string;

  /** Relative path or URL of the optimized (compressed/resized) recipe image. */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'path_img_optimized',
  })
  pathImgOptimized?: string;

  /**
   * Total yield of the recipe expressed in `unidadResultado`.
   * Used to calculate unit cost: costeUnitarioEstimado = costTotal / rendimiento.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'rendimiento',
    transformer: new ColumnNumericTransformer(),
  })
  rendimiento?: number | null;

  /** Unit of measure for the recipe yield (e.g. kg, l, pieza). */
  @Column({
    type: 'enum',
    enum: UnidadIngrediente,
    nullable: true,
    name: 'unidad_resultado',
  })
  unidadResultado?: UnidadIngrediente | null;

  /** Number of days before the produced batch expires. Used to set `fechaCaducidad` on the inventory lot. */
  @Column({
    type: 'integer',
    nullable: true,
    name: 'dias_caducidad',
  })
  diasCaducidad?: number | null;

  /**
   * Estimated unit cost (cost per unit of `rendimiento`).
   * Recalculated automatically each time the recipe ingredients or their prices change.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
    name: 'coste_unitario_estimado',
    transformer: new ColumnNumericTransformer(),
  })
  costeUnitarioEstimado?: number | null;

  /** Number of portions this recipe yields by default. */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'raciones',
    default: 1,
    transformer: new ColumnNumericTransformer(),
  })
  raciones?: number | null;

  /** Size of each portion expressed in the same unit as `unidadResultado`. */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'tamanio_racion',
    transformer: new ColumnNumericTransformer(),
  })
  tamanioRacion?: number | null;

  /** List of ingredients (with quantities and units) that compose this recipe. */
  @OneToMany(() => RecetaIngrediente, (ri) => ri.receta)
  ingredientes!: Relation<RecetaIngrediente[]>;
}
