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
import { Rol } from './rol.entity';

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
   * Fecha en que se asignó el rol al usuario
   */
  @CreateDateColumn({ type: 'timestamp', name: 'asignado_en' })
  asignadoEn!: Date;

  /**
   * ID del usuario que realizó la asignación
   */
  @Column({ type: 'uuid', nullable: true, name: 'asignado_por' })
  asignadoPor?: string;

  /**
   * Estado de la asignación (activo/inactivo)
   * Permite desactivar temporalmente un rol sin eliminarlo
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Relación con Usuario
   */
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  /**
   * Relación con Rol
   */
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;
}
