import { Entity, Column, Index, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity({ name: 'rol' })
@Index('idx_rol_nombre', ['nombre'])
@Index('idx_rol_activo', ['activo'])
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
  permisos!: Permiso[];

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios!: Usuario[];
}
