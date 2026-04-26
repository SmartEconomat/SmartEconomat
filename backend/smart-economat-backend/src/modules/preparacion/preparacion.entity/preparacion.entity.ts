import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PreparacionEstado } from '../enums/preparacion.enums';

/**
 * Documentación en español.
 */
@Entity('preparacion')
export class Preparacion extends BaseEntity {
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
  @Column({ name: 'ubicacion_destino_id', nullable: true })
  ubicacionDestinoId?: string;

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
    name: 'cantidad_a_producir',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadAProducir!: number;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'enum',
    enum: PreparacionEstado,
    default: PreparacionEstado.PENDIENTE,
  })
  estado!: PreparacionEstado;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_programada',
  })
  fechaProgramada?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_inicio',
  })
  fechaInicio?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_finalizacion',
  })
  fechaFinalizacion?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
