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

/** Clase pública (UsuarioRol). Paquete: smart-economat-backend (Nest). */
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'asignado_en' })
  asignadoEn!: Date;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'uuid', nullable: true, name: 'asignado_por' })
  asignadoPor?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;
}
