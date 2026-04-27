import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { DificultadReceta, UnidadIngrediente } from '../enums/receta.enums';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

/**
 * Documentación en español.
 */
@Index(['dificultad', 'tiempoEstimadoMinutos'])
@Entity('receta')
export class Receta extends BaseEntity {
  /**
   * Documentación en español.
   */
  @Column({ length: 150 })
  nombre!: string;

  /**
   * Documentación en español.
   */
  @Column('text')
  instrucciones!: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'integer',
    name: 'tiempo_estimado_minutos',
    default: 0,
  })
  tiempoEstimadoMinutos!: number;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'enum',
    enum: DificultadReceta,
    enumName: 'dificultad_receta_enum',
  })
  dificultad!: DificultadReceta;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'path_img' })
  pathImg?: string;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'path_img_optimized',
  })
  pathImgOptimized?: string;

  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  @Column({
    type: 'enum',
    enum: UnidadIngrediente,
    nullable: true,
    name: 'unidad_resultado',
  })
  unidadResultado?: UnidadIngrediente | null;

  /**
   * Documentación en español.
   */
  @Column({
    type: 'integer',
    nullable: true,
    name: 'dias_caducidad',
  })
  diasCaducidad?: number | null;

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  @OneToMany(() => RecetaIngrediente, (ri) => ri.receta)
  ingredientes!: Relation<RecetaIngrediente[]>;
}
