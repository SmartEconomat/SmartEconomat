import {
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Profesor } from './profesor.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';

@Entity('alumno_slot')
@Index('idx_slot_profesor_aula_clase', ['profesor', 'aula', 'numeroClase'], {
  unique: true,
})
export class AlumnoSlot extends BaseEntity {
  @ManyToOne(() => Profesor, (profesor) => profesor.slots)
  @JoinColumn({ name: 'profesor_id' })
  profesor!: Relation<Profesor>;

  @Column()
  aula!: string;

  @Column({ name: 'numero_clase' })
  numeroClase!: number;

  @Column({ default: 30 })
  capacidad!: number;

  @Column({ name: 'codigo_slot', unique: true, nullable: true })
  codigoSlot?: string;

  @OneToMany(() => Alumno, (alumno) => alumno.slot)
  alumnos?: Relation<Alumno[]>;
}
