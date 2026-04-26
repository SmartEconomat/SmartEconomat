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
     * Documentación en español.
     */
  @CreateDateColumn({ type: 'timestamptz', name: 'asignado_en' })
  asignadoEn!: Date;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PlantillaRol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_rol_id' })
  plantillaRol!: PlantillaRol;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
