import {
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Profesor } from './profesor.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';

@Entity('alumno_slot')
@Index(['profesorId', 'aula', 'numeroClase'], {
  unique: true,
})
export class AlumnoSlot extends BaseEntity {
  @Column({ name: 'profesor_id' })
  profesorId!: string;

  @ManyToOne(() => Profesor, (profesor) => profesor.slots)
  @JoinColumn({ name: 'profesor_id' })
  profesor!: Relation<Profesor>;

  @Column()
  aula!: string;

  @Column({ name: 'numero_clase' })
  numeroClase!: number;

  @OneToOne(() => Alumno, (alumno) => alumno.slot, { nullable: true })
  alumno?: Relation<Alumno>;
}
