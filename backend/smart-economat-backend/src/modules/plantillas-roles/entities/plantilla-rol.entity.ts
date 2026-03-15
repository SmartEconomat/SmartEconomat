import {
  Entity,
  Column,
  Index,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

@Entity({ name: 'plantilla_rol' })
@Index('idx_plantilla_nombre', ['nombre'])
@Index('idx_plantilla_activo', ['activo'])
export class PlantillaRol extends BaseEntity {
  /**
   * Nombre único de la plantilla
   * Ejemplo: "SUPER_ADMIN", "ADMINISTRADOR", "GESTOR"
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  /**
   * Descripción de la plantilla
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Indica si la plantilla es editable
   * Las plantillas de sistema (SUPER_ADMIN) no son editables
   */
  @Column({ type: 'boolean', default: true, name: 'es_editable' })
  esEditable!: boolean;

  /**
   * Estado de la plantilla (activa/inactiva)
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * ID de la plantilla padre (para herencia)
   * Permite que una plantilla extienda permisos de otra
   */
  @Column({ type: 'uuid', nullable: true, name: 'plantilla_padre_id' })
  plantillaPadreId?: string;

  /**
   * Relación con la plantilla padre (self-reference)
   */
  @ManyToOne(() => PlantillaRol, (plantilla) => plantilla.plantillasHijas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plantilla_padre_id' })
  plantillaPadre?: PlantillaRol;

  /**
   * Plantillas que heredan de esta (inversa)
   */
  @OneToMany(() => PlantillaRol, (plantilla) => plantilla.plantillaPadre)
  plantillasHijas!: PlantillaRol[];

  /**
   * Relación ManyToMany con Permiso
   * Una plantilla contiene un conjunto base de permisos
   */
  @ManyToMany(() => Permiso, { cascade: false })
  @JoinTable({
    name: 'plantilla_rol_permiso',
    joinColumn: { name: 'plantilla_rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisos!: Permiso[];
}
