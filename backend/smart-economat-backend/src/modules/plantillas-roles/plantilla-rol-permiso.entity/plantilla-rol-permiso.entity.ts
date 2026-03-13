import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { PlantillaRol } from '../plantilla-rol.entity/plantilla-rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

@Entity({ name: 'plantilla_rol_permiso' })
@Index('idx_plantilla_permiso_plantilla', ['plantillaRolId'])
@Index('idx_plantilla_permiso_permiso', ['permisoId'])
export class PlantillaRolPermiso {
  @PrimaryColumn({ type: 'uuid', name: 'plantilla_rol_id' })
  plantillaRolId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permiso_id' })
  permisoId!: string;

  /**
   * Fecha en que se agregó el permiso a la plantilla
   */
  @CreateDateColumn({ type: 'timestamp', name: 'asignado_en' })
  asignadoEn!: Date;

  /**
   * Relación con PlantillaRol
   */
  @ManyToOne(() => PlantillaRol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_rol_id' })
  plantillaRol!: PlantillaRol;

  /**
   * Relación con Permiso
   */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
