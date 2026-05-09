import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PreparacionEstado } from '../enums/preparacion.enums';

/**
 * Representa preparacion en el sistema.
 */
@Entity('preparacion')
@Check(
  'CHK_preparacion_cantidad_step_05',
  `("cantidad_a_producir" * 2) = floor("cantidad_a_producir" * 2) AND "cantidad_a_producir" > 0`
)
export class Preparacion extends BaseEntity {
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
  @Column({ name: 'ubicacion_destino_id', nullable: true })
  ubicacionDestinoId?: string;

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
    name: 'cantidad_a_producir',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadAProducir!: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'enum',
    enum: PreparacionEstado,
    default: PreparacionEstado.PENDIENTE,
  })
  estado!: PreparacionEstado;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_programada',
  })
  fechaProgramada?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_inicio',
  })
  fechaInicio?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_finalizacion',
  })
  fechaFinalizacion?: Date | null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
