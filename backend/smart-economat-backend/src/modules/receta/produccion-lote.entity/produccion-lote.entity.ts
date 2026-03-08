import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Receta } from '../receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity('produccion_lote')
@Index(['recetaId'])
@Index(['usuarioId'])
@Index(['fechaProduccion'])
export class ProduccionLote extends BaseEntity {
  @Column({ name: 'receta_id' })
  recetaId!: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

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
    name: 'cantidad_producida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadProducida!: number;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_produccion',
  })
  fechaProduccion!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'fecha_caducidad',
  })
  fechaCaducidad?: Date | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    name: 'coste_total_real',
    transformer: new ColumnNumericTransformer(),
  })
  costeTotalReal!: number;
}
