import {
  Entity,
  Column,
  Index,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';

@Entity({ name: 'rol' })
@Index('idx_rol_nombre', ['nombre'])
@Index('idx_rol_activo', ['activo'])
@Index('idx_rol_plantilla_rol_id', ['plantillaRolId'])
export class Rol extends BaseEntity {
  /**
   * Nombre único del rol (ej: "Administrador de Economato")
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  /**
   * Descripción detallada del rol
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Indica si es un rol de sistema (no editable/eliminable)
   */
  @Column({ type: 'boolean', default: false, name: 'es_sistema' })
  esSistema!: boolean;

  /**
   * Estado del rol (activo/inactivo)
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Plantilla base del rol (opcional)
   */
  @Column({ type: 'uuid', nullable: true, name: 'plantilla_rol_id' })
  plantillaRolId?: string;

  /**
   * Relación con la plantilla de permisos de referencia
   */
  @ManyToOne(() => PlantillaRol, (plantilla) => plantilla.roles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plantilla_rol_id' })
  plantillaRol?: Relation<PlantillaRol>;

  /**
   * Relación ManyToMany con Permiso
   * Un rol puede tener múltiples permisos
   * Un permiso puede pertenecer a múltiples roles
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.roles, { cascade: false })
  @JoinTable({
    name: 'rol_permiso',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisos!: Relation<Permiso[]>;

  @Exclude()
  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios!: Relation<Usuario[]>;
}
