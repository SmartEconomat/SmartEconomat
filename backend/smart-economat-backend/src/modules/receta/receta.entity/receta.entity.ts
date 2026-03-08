import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import {
  DificultadReceta,
  TiempoReceta,
  UnidadIngrediente,
} from '../enums/receta.enums';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

@Index(['dificultad', 'tiempo'])
@Entity('receta')
export class Receta extends BaseEntity {
  @Column({ length: 150 })
  nombre!: string;

  @Column('text')
  instrucciones!: string;

  @Column({
    type: 'enum',
    enum: TiempoReceta,
    enumName: 'tiempo_receta_enum',
  })
  tiempo!: TiempoReceta;

  @Column({
    type: 'enum',
    enum: DificultadReceta,
    enumName: 'dificultad_receta_enum',
  })
  dificultad!: DificultadReceta;

  @Column({
    name: 'tiempo_preparacion',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  tiempoPreparacion!: string;

  @Column({ name: 'producto_resultado_id', nullable: true })
  productoResultadoId?: string;

  @ManyToOne(() => Producto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'producto_resultado_id' })
  productoResultado?: Relation<Producto>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    name: 'rendimiento',
    transformer: new ColumnNumericTransformer(),
  })
  rendimiento?: number | null;

  @Column({
    type: 'enum',
    enum: UnidadIngrediente,
    nullable: true,
    name: 'unidad_resultado',
  })
  unidadResultado?: UnidadIngrediente | null;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'dias_caducidad',
  })
  diasCaducidad?: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
    name: 'coste_unitario_estimado',
    transformer: new ColumnNumericTransformer(),
  })
  costeUnitarioEstimado?: number | null;

  @OneToMany(() => RecetaIngrediente, (ri) => ri.receta)
  ingredientes!: Relation<RecetaIngrediente[]>;
}
