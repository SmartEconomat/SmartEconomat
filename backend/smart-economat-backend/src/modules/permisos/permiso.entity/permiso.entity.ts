import { Entity, Column, Index, ManyToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PlantillaRol } from '../../plantillas-roles/entities/plantilla-rol.entity';

@Entity({ name: 'permiso' })
@Index('idx_permiso_codigo', ['codigo'])
@Index('idx_permiso_modulo', ['modulo'])
@Index('idx_permiso_activo', ['activo'])
export class Permiso extends BaseEntity {
  /**
   * Código único del permiso (formato: modulo:accion)
   * Ejemplo: "usuarios:listar", "productos:crear"
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  codigo!: string;

  /**
   * Nombre legible del permiso
   * Ejemplo: "Listar usuarios", "Crear productos"
   */
  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  /**
   * Descripción detallada del permiso
   */
  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  /**
   * Módulo o recurso al que pertenece
   * Ejemplo: "usuarios", "productos", "inventario"
   */
  @Column({ type: 'varchar', length: 50 })
  modulo!: string;

  /**
   * Acción que representa el permiso
   * Ejemplo: "listar", "crear", "editar", "eliminar"
   */
  @Column({ type: 'varchar', length: 50 })
  accion!: string;

  /**
   * Estado del permiso (activo/inactivo)
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Relación ManyToMany con Rol (inversa)
   */
  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles!: Rol[];

  /**
   * Usuarios que tienen este permiso asignado de forma individual
   */
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosAdicionales)
  usuariosAdicionales: Relation<Usuario>[];

  /**
   * Usuarios que tienen este permiso explícitamente revocado
   */
  @ManyToMany(() => Usuario, (usuario) => usuario.permisosExcluidos)
  usuariosExcluidos: Relation<Usuario>[];

  @ManyToMany(() => PlantillaRol, (plantilla) => plantilla.permisos)
  plantillasRoles: Relation<PlantillaRol>[];
}
