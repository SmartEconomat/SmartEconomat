import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import type { Receta } from '../receta.entity/receta.entity';
import type { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Index('idx_produccion_lote_receta', ['receta'])
@Index('idx_produccion_lote_usuario', ['usuario'])
@Index('idx_produccion_lote_fecha', ['fechaProduccion'])
@Entity('produccion_lote')
export class ProduccionLote extends BaseEntity {
  @ManyToOne('Receta', { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  @ManyToOne('Usuario', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario> | null;

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
