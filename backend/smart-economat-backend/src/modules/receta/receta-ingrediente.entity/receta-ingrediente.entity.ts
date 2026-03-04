import { Entity, Column, ManyToOne, JoinColumn, type Relation } from 'typeorm';
import type { Receta } from '../receta.entity/receta.entity';
import type { Producto } from '../../producto/producto.entity/producto.entity';
import { UnidadIngrediente } from '../enums/receta.enums';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('receta_ingrediente')
export class RecetaIngrediente extends BaseEntity {
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
