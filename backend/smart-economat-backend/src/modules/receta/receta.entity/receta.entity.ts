import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { DificultadReceta, TiempoReceta } from '../enums/receta.enums';
import type { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';

import { BaseEntity } from '../../../common/entities/base.entity';

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
    name: 'tiempoPreparacion',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  tiempoPreparacion!: string;

  @OneToMany('RecetaIngrediente', (ri: RecetaIngrediente) => ri.receta)
  ingredientes!: Relation<RecetaIngrediente[]>;
}
