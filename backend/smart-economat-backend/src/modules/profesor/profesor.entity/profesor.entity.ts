import {
  Entity,
  Column,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import type { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import type { AlumnoSlot } from './alumno-slot.entity';

@Entity('profesor')
@Index('idx_profesor_user', ['user'], { unique: true })
export class Profesor extends BaseEntity {
  @OneToOne(() => Usuario, (u) => u.profesor)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Usuario>;

  @Column({ unique: true })
  cial!: string;

  @OneToMany('AlumnoSlot', 'profesor')
  slots!: AlumnoSlot[];

  @OneToMany('Alumno', 'profesor')
  alumnos!: Alumno[];
}
