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
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

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

  @Column({ name: 'ubicacion_id', nullable: true })
  ubicacionId?: string;

  @Column({ name: 'codigo_slot', unique: true, nullable: true })
  codigoSlot?: string;

  @ManyToOne(() => Ubicacion, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion?: Relation<Ubicacion>;

  @OneToMany(() => Alumno, (alumno) => alumno.slot)
  alumnos?: Relation<Alumno[]>;
}
