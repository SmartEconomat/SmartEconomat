import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PreparacionEstado } from '../enums/preparacion.enums';

@Entity('preparacion')
export class Preparacion extends BaseEntity {
  @Column({ name: 'receta_id' })
  recetaId!: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @Column({ name: 'ubicacion_destino_id', nullable: true })
  ubicacionDestinoId?: string;

  @ManyToOne(() => Receta, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_a_producir',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadAProducir!: number;

  @Column({
    type: 'enum',
    enum: PreparacionEstado,
    default: PreparacionEstado.PENDIENTE,
  })
  estado!: PreparacionEstado;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_programada',
  })
  fechaProgramada?: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_inicio',
  })
  fechaInicio?: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_finalizacion',
  })
  fechaFinalizacion?: Date | null;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
