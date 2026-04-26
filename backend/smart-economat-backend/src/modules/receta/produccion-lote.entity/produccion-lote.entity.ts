import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { EstadoLote } from '../enums/receta.enums';

/**
 * Documentación en español.
 */
@Entity('produccion_lote')
@Index(['recetaId'])
@Index(['usuarioId'])
@Index(['preparacionId'])
@Index(['fechaProduccion'])
export class ProduccionLote extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ name: 'receta_id' })
  recetaId!: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

        /**
     * Documentación en español.
     */
  @Column({ name: 'preparacion_id', nullable: true })
  preparacionId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Receta, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_produccion',
  })
  fechaProduccion!: Date;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_agotado',
  })
  fechaAgotado?: Date | null;

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  @Column({
    type: 'enum',
    enum: EstadoLote,
    default: EstadoLote.DISPONIBLE,
  })
  estado!: EstadoLote;
}
