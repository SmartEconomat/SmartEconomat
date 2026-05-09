import { Check, Column, Entity, Index, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { DificultadReceta, UnidadIngrediente } from '../enums/receta.enums';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

/**
 * Representa receta en el sistema.
 */
@Index(['dificultad', 'tiempoEstimadoMinutos'])
@Check(
  'CHK_receta_tiempo_estimado_minutos_min_10',
  `"tiempo_estimado_minutos" >= 10`
)
@Check(
  'CHK_receta_raciones_step_05',
  `("raciones" * 2) = floor("raciones" * 2) AND "raciones" > 0`
)
@Entity('receta')
export class Receta extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ length: 150 })
  nombre!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column('text')
  instrucciones!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'integer',
    name: 'tiempo_estimado_minutos',
    default: 10,
  })
  tiempoEstimadoMinutos!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: DificultadReceta,
    enumName: 'dificultad_receta_enum',
  })
  dificultad!: DificultadReceta;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'path_img' })
  pathImg?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'path_img_optimized',
  })
  pathImgOptimized?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: UnidadIngrediente,
    nullable: true,
    name: 'unidad_resultado',
  })
  unidadResultado?: UnidadIngrediente | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'integer',
    nullable: true,
    name: 'dias_caducidad',
  })
  diasCaducidad?: number | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'tamanio_racion',
    transformer: new ColumnNumericTransformer(),
  })
  tamanioRacion?: number | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => RecetaIngrediente, (ri) => ri.receta)
  ingredientes!: Relation<RecetaIngrediente[]>;
}
