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

/** Clase pública (Rol). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'rol' })
@Index('idx_rol_nombre', ['nombre'])
@Index('idx_rol_activo', ['activo'])
@Index('idx_rol_plantilla_rol_id', ['plantillaRolId'])
export class Rol extends BaseEntity {
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
  @Column({ type: 'boolean', default: false, name: 'es_sistema' })
  esSistema!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @Column({ type: 'uuid', nullable: true, name: 'plantilla_rol_id' })
  plantillaRolId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @ManyToOne(() => PlantillaRol, (plantilla) => plantilla.roles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plantilla_rol_id' })
  plantillaRol?: Relation<PlantillaRol>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
