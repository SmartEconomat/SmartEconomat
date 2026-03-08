import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Receta } from '../receta.entity/receta.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity('produccion_lotes')
export class ProduccionLote extends BaseEntity {
  @ManyToOne(() => Receta)
  receta: Receta;

  @Column('float')
  cantidad: number;

  @Column()
  fechaProduccion: Date;

  @Column({ nullable: true })
  fechaCaducidad: Date;

  @ManyToOne(() => Usuario)
  responsable: Usuario;

  @Column({ default: 'pendiente' })
  estado: string;
}
