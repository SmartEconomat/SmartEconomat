import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { DificultadReceta, TiempoReceta } from '../enums/receta.enums';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';

@Index(['dificultad', 'tiempo'])
@Entity('receta')
export class Receta {
  @PrimaryColumn('uuid', {
    name: 'id_receta',
    default: () => 'uuid_generate_v7()',
  })
  id!: string;

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

  @OneToMany(() => RecetaIngrediente, (ri) => ri.receta)
  ingredientes!: RecetaIngrediente[];
}
