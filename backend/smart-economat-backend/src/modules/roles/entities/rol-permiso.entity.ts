import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

@Entity({ name: 'rol_permiso' })
@Index('idx_rol_permiso_rol', ['rolId'])
@Index('idx_rol_permiso_permiso', ['permisoId'])
export class RolPermiso {
  @PrimaryColumn({ type: 'uuid', name: 'rol_id' })
  rolId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permiso_id' })
  permisoId!: string;

  /**
   * Fecha en que se asignó el permiso al rol
   */
  @CreateDateColumn({ type: 'timestamp', name: 'asignado_en' })
  asignadoEn!: Date;

  /**
   * ID del usuario que realizó la asignación
   */
  @Column({ type: 'uuid', nullable: true, name: 'asignado_por' })
  asignadoPor?: string;

  /**
   * Relación con Rol
   */
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;

  /**
   * Relación con Permiso
   */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
