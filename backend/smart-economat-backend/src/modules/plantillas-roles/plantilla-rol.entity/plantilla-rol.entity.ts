import {
  Entity,
  Column,
  Index,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';

/** Clase pública (PlantillaRol). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'plantilla_rol' })
@Index('idx_plantilla_nombre', ['nombre'])
@Index('idx_plantilla_activo', ['activo'])
export class PlantillaRol extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'boolean', default: true, name: 'es_editable' })
  esEditable!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'uuid', nullable: true, name: 'plantilla_padre_id' })
  plantillaPadreId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => PlantillaRol, (plantilla) => plantilla.plantillasHijas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plantilla_padre_id' })
  plantillaPadre?: Relation<PlantillaRol>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => PlantillaRol, (plantilla) => plantilla.plantillaPadre)
  plantillasHijas!: Relation<PlantillaRol[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @OneToMany(() => Rol, (rol) => rol.plantillaRol)
  roles!: Relation<Rol[]>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.plantillasRoles, {
    cascade: false,
  })
  @JoinTable({
    name: 'plantilla_rol_permiso',
    joinColumn: { name: 'plantilla_rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisos!: Relation<Permiso[]>;
}
