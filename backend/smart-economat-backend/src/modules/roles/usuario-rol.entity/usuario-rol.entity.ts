import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Rol } from '../rol.entity/rol.entity';

@Entity({ name: 'usuario_rol' })
@Index('idx_usuario_rol_usuario', ['usuarioId'])
@Index('idx_usuario_rol_rol', ['rolId'])
@Index('idx_usuario_rol_activo', ['activo'])
export class UsuarioRol {
  @PrimaryColumn({ type: 'uuid', name: 'usuario_id' })
  usuarioId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'rol_id' })
  rolId!: string;

        /**
     * Documentación en español.
     */
  @CreateDateColumn({ type: 'timestamptz', name: 'asignado_en' })
  asignadoEn!: Date;

        /**
     * Documentación en español.
     */
  @Column({ type: 'uuid', nullable: true, name: 'asignado_por' })
  asignadoPor?: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;
}
