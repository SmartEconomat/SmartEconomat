import { Entity, Column, Index, ManyToMany, type Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';

/** Clase pública (Permiso). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'permiso' })
@Index('idx_permiso_codigo', ['codigo'])
@Index('idx_permiso_modulo', ['modulo'])
@Index('idx_permiso_activo', ['activo'])
export class Permiso extends BaseEntity {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  codigo!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 50 })
  modulo!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'varchar', length: 50 })
  accion!: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles!: Rol[];

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosAdicionales)
  usuariosAdicionales: Relation<Usuario>[];

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Exclude()
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosExcluidos)
  usuariosExcluidos: Relation<Usuario>[];

  @Exclude()
  @ManyToMany(() => PlantillaRol, (plantilla) => plantilla.permisos)
  plantillasRoles: Relation<PlantillaRol>[];
}
