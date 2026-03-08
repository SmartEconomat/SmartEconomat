import { Entity, Column, JoinColumn, OneToOne, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';

@Entity('alumno')
@Index(['usuarioId'], { unique: true })
@Index(['alumnoSlotId'], { unique: true })
export class Alumno extends BaseEntity {
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @Column({ name: 'alumno_slot_id' })
  alumnoSlotId!: string;

  @OneToOne(() => Usuario, (u) => u.alumno)
  @JoinColumn({ name: 'usuario_id' })
  user!: Relation<Usuario>;

  @OneToOne(() => AlumnoSlot, (slot) => slot.alumno)
  @JoinColumn({ name: 'alumno_slot_id' })
  slot!: Relation<AlumnoSlot>;
}
