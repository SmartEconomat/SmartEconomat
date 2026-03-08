import {
  Entity,
  Column,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { AlumnoSlot } from './alumno-slot.entity';

@Entity('profesor')
@Index(['usuarioId'], { unique: true })
export class Profesor extends BaseEntity {
  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @OneToOne(() => Usuario, (u) => u.profesor)
  @JoinColumn({ name: 'usuario_id' })
  user!: Relation<Usuario>;

  @Column({ unique: true })
  cial!: string;

  @OneToMany(() => AlumnoSlot, (slot) => slot.profesor)
  slots!: Relation<AlumnoSlot[]>;
}
