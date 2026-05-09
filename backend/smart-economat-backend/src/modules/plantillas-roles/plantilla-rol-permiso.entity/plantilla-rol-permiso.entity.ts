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

/** Clase pública (PlantillaRolPermiso). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'plantilla_rol_permiso' })
@Index('idx_plantilla_permiso_plantilla', ['plantillaRolId'])
@Index('idx_plantilla_permiso_permiso', ['permisoId'])
export class PlantillaRolPermiso {
  @PrimaryColumn({ type: 'uuid', name: 'plantilla_rol_id' })
  plantillaRolId!: string;

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
  @ManyToOne(() => PlantillaRol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_rol_id' })
  plantillaRol!: PlantillaRol;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso!: Permiso;
}
