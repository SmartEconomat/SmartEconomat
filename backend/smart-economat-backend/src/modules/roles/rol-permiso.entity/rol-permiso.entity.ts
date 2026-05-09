import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Rol } from '../rol.entity/rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

/** Clase pública (RolPermiso). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'rol_permiso' })
@Index('idx_rol_permiso_rol', ['rolId'])
@Index('idx_rol_permiso_permiso', ['permisoId'])
export class RolPermiso {
  @PrimaryColumn({ type: 'uuid', name: 'rol_id' })
  rolId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permiso_id' })
  permisoId!: string;

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
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
