import { Entity, Column, JoinColumn, OneToOne, ManyToOne, Index, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';

@Entity('alumno')
@Index('idx_alumno_user', ['user'], { unique: true })
@Index('idx_alumno_slot', ['slot'], { unique: true })
export class Alumno extends BaseEntity {
  @OneToOne(() => Usuario, (u) => u.alumno)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<Usuario>;

  @OneToOne(() => AlumnoSlot, (slot) => slot.alumno)
  @JoinColumn({ name: 'slot_id' })
  slot!: Relation<AlumnoSlot>;

  @ManyToOne(() => Profesor, (profesor) => profesor.alumnos)
  @JoinColumn({ name: 'profesor_id' })
  profesor!: Relation<Profesor>;
}
