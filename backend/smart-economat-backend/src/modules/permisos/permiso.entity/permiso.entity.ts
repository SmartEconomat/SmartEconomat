import { Entity, Column, Index, ManyToMany, type Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';

@Entity({ name: 'permiso' })
@Index('idx_permiso_codigo', ['codigo'])
@Index('idx_permiso_modulo', ['modulo'])
@Index('idx_permiso_activo', ['activo'])
export class Permiso extends BaseEntity {
  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  codigo!: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 50 })
  modulo!: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'varchar', length: 50 })
  accion!: string;

  /**
   * Documentación en español.
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Documentación en español.
   */
  @Exclude()
  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles!: Rol[];

  /**
   * Documentación en español.
   */
  @Exclude()
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosAdicionales)
  usuariosAdicionales: Relation<Usuario>[];

  /**
   * Documentación en español.
   */
  @Exclude()
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosExcluidos)
  usuariosExcluidos: Relation<Usuario>[];

  @Exclude()
  @ManyToMany(() => PlantillaRol, (plantilla) => plantilla.permisos)
  plantillasRoles: Relation<PlantillaRol>[];
}
