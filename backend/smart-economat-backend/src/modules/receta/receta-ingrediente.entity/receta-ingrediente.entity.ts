import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Receta } from '../receta.entity/receta.entity';
import type { Producto } from '../../producto/producto.entity/producto.entity';
import { UnidadIngrediente } from '../enums/receta.enums';

@Entity('receta_ingrediente')
export class RecetaIngrediente {
  @PrimaryColumn('uuid', {
    name: 'id_receta_ingrediente',
    default: () => 'uuid_generate_v7()',
  })
  id!: string;

  @Column('double precision')
  cantidad!: number;

  @Column({ type: 'enum', enum: UnidadIngrediente })
  unidad!: UnidadIngrediente;

  @ManyToOne('Receta', (receta: Receta) => receta.ingredientes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receta_id' })
  receta!: Relation<Receta>;

  @ManyToOne('Producto', { nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;
}
