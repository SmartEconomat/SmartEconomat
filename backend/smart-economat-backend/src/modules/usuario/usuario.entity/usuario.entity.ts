import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
  type Relation,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import * as bcrypt from 'bcrypt';
import { rolUsuario, UserStatus } from '../enums/usuario.enums';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { Archivo } from '../../archivo/archivo.entity/archivo.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

/**
 * Represents a user account stored in the `usuario` table.
 * Handles authentication (bcrypt password hashing), role-based access control,
 * and direct permission overrides (additional / excluded).
 *
 * @class Usuario
 * @extends {BaseEntity}
 */
@Entity({ name: 'usuario' })
@Index(['username'])
@Index(['email'])
export class Usuario extends BaseEntity {
  /** Full display name of the user. Optional. */
  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre?: string | null;

  /** Unique login username. Used for authentication. */
  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  /**
   * Bcrypt-hashed password. Excluded from SELECT queries by default (select: false).
   * Automatically hashed by `@BeforeInsert` / `@BeforeUpdate` hooks.
   */
  @Column({ type: 'varchar', length: 100, select: false })
  password!: string;

  /** Unique email address. Optional. Stored in lowercase. */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

  /** Legacy single-role field. Use `roles` (ManyToMany) for fine-grained control. */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.ALUMNO })
  rol!: rolUsuario;

  /** Account lifecycle status (INACTIVE, ACTIVE, BLOCKED). */
  @Index('idx_usuario_status', ['status'])
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status!: UserStatus;

  /**
   * One-time password (OTP) for the password-reset flow.
   * Excluded from SELECT queries by default (select: false).
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordOtp?: string | null;

  /** Expiry timestamp for the OTP. After this date the OTP is invalid. */
  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordOtpExpires?: Date | null;

  /** When true, the user must change their password on the next login. */
  @Column({ type: 'boolean', default: false, name: 'must_change_password' })
  mustChangePassword!: boolean;

  /** Purchase orders (Pedidos) created by this user. */
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Relation<Pedido[]>;

  /** Stock receptions registered by this user. */
  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Relation<Recepcion[]>;

  /** Inventory movements performed by this user. */
  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Relation<Movimiento[]>;

  /** Incidents resolved by this user acting as resolver. */
  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Relation<Incidencia[]>;

  /** Files (images, documents) uploaded by this user. */
  @OneToMany(() => Archivo, (archivo) => archivo.usuario)
  archivos!: Relation<Archivo[]>;

  /** Associated Profesor profile, if the user has the PROFESOR role. */
  @OneToOne(() => Profesor, (profesor) => profesor.user)
  profesor?: Relation<Profesor>;

  /** Associated Alumno profile, if the user has the ALUMNO role. */
  @OneToOne(() => Alumno, (alumno) => alumno.user)
  alumno?: Relation<Alumno>;

  /** Roles assigned to this user via the `usuario_rol` junction table. */
  @ManyToMany(() => Rol, (rol) => rol.usuarios, { cascade: true })
  @JoinTable({
    name: 'usuario_rol',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

  /**
   * Permissions assigned directly to the user in addition to those inherited from their roles.
   * Stored in the `usuario_permiso_adicional` junction table.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosAdicionales)
  @JoinTable({
    name: 'usuario_permiso_adicional',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosAdicionales: Permiso[];

  /**
   * Permissions explicitly revoked for this user, even if granted by their roles.
   * Stored in the `usuario_permiso_excluido` junction table.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosExcluidos)
  @JoinTable({
    name: 'usuario_permiso_excluido',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosExcluidos: Permiso[];

  /** Indicates whether the account is active. Soft-disable without deleting the record. */
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /**
   * @description Hashes the `password` field using bcrypt (10 salt rounds) before the entity
   * is inserted or updated. Skips hashing if the value already starts with a bcrypt prefix (`$2`),
   * preventing double-hashing when the entity is saved multiple times.
   * Triggered automatically by TypeORM `@BeforeInsert` and `@BeforeUpdate` hooks.
   * @returns {Promise<void>}
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * @description Validates a plain-text password against the stored bcrypt hash.
   * @param {string} plainPassword - The plain-text password to verify.
   * @returns {Promise<boolean>} `true` if the password matches the stored hash, `false` otherwise.
   */
  async validarPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export { rolUsuario as Rol };
