import {
  Entity,
  JoinColumn,
  OneToOne,
  ManyToOne,
  Index,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';

/** Clase pública (Alumno). Paquete: smart-economat-backend (Nest). */
@Entity('alumno')
@Index('idx_alumno_user', ['user'], { unique: true })
export class Alumno extends BaseEntity {
  @OneToOne(() => Usuario, (u) => u.alumno)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Usuario>;

  @ManyToOne(() => AlumnoSlot, (slot) => slot.alumnos)
  @JoinColumn({ name: 'slot_id' })
  slot!: Relation<AlumnoSlot>;

  @ManyToOne(() => Profesor, (profesor) => profesor.alumnos)
  @JoinColumn({ name: 'profesor_id' })
  profesor!: Relation<Profesor>;
}
