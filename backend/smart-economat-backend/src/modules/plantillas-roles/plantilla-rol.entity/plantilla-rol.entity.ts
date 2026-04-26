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

@Entity({ name: 'plantilla_rol' })
@Index('idx_plantilla_nombre', ['nombre'])
@Index('idx_plantilla_activo', ['activo'])
export class PlantillaRol extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'boolean', default: true, name: 'es_editable' })
  esEditable!: boolean;

        /**
     * Documentación en español.
     */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

        /**
     * Documentación en español.
     */
  @Column({ type: 'uuid', nullable: true, name: 'plantilla_padre_id' })
  plantillaPadreId?: string;

        /**
     * Documentación en español.
     */
  @ManyToOne(() => PlantillaRol, (plantilla) => plantilla.plantillasHijas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plantilla_padre_id' })
  plantillaPadre?: Relation<PlantillaRol>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => PlantillaRol, (plantilla) => plantilla.plantillaPadre)
  plantillasHijas!: Relation<PlantillaRol[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Rol, (rol) => rol.plantillaRol)
  roles!: Relation<Rol[]>;

        /**
     * Documentación en español.
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
