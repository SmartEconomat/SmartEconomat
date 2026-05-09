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
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { AlumnoSlot } from './alumno-slot.entity';

/** Clase pública (Profesor). Paquete: smart-economat-backend (Nest). */
@Entity('profesor')
@Index('idx_profesor_user', ['user'], { unique: true })
export class Profesor extends BaseEntity {
  @OneToOne(() => Usuario, (u) => u.profesor)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Usuario>;

  @Column({ unique: true })
  cial!: string;

  @OneToMany(() => AlumnoSlot, (slot) => slot.profesor)
  slots!: Relation<AlumnoSlot[]>;

  @OneToMany(() => Alumno, (alumno) => alumno.profesor)
  alumnos!: Relation<Alumno[]>;
}
