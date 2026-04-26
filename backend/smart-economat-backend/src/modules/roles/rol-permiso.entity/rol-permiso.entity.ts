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

@Entity({ name: 'rol_permiso' })
@Index('idx_rol_permiso_rol', ['rolId'])
@Index('idx_rol_permiso_permiso', ['permisoId'])
export class RolPermiso {
  @PrimaryColumn({ type: 'uuid', name: 'rol_id' })
  rolId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permiso_id' })
  permisoId!: string;

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
  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
