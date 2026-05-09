import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  AfterLoad,
  ManyToMany,
  JoinTable,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import * as bcrypt from 'bcrypt';
import { rolUsuario, UserStatus, UserLanguage } from '../enums/usuario.enums';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { Archivo } from '../../archivo/archivo.entity/archivo.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { UsuarioUbicacion } from '../usuario-ubicacion.entity/usuario-ubicacion.entity';

/**
 * Entidad que representa a un usuario del sistema SmartEconomat.
 * Almacena credenciales, roles, estados y relaciones con otras entidades (Profesor, Alumno, Pedidos, etc.).
 */
@Entity({ name: 'usuario' })
@Index(['username'])
@Index(['email'])
@Index('idx_usuario_ubicacion_id', ['ubicacionId'])
export class Usuario extends BaseEntity {
  /**
  /**
   * Nombre completo o de visualización del usuario.
   */
  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre?: string | null;

  /**
  /**
   * Nombre de usuario único para el inicio de sesión.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  /**
  /**
   * Hash de la contraseña (bcrypt). Campo no seleccionable por defecto por seguridad.
   */
  @Column({ type: 'varchar', length: 100, select: false })
  password!: string;

  /**
  /**
   * Dirección de correo electrónico única.
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

  /**
  /**
   * Rol principal del usuario en el sistema (Enum).
   */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.ALUMNO })
  rol!: rolUsuario;

  /**
  /**
   * Ubicación operativa asignada al usuario (consumo / stock).
   */
  @Column({ name: 'ubicacion_id', nullable: true })
  ubicacionId?: string | null;

  /**
  /**
   * Ubicación vinculada al usuario.
   */
  @ManyToOne(() => Ubicacion, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion?: Relation<Ubicacion>;

  /** Accesos declarados usuario–ubicación (permisos y contexto, no ownership). */
  @OneToMany(() => UsuarioUbicacion, (uu) => uu.usuario)
  usuarioUbicaciones?: Relation<UsuarioUbicacion[]>;

  /**
   * Proyección de compatibilidad tras pivot (no es columna persistente).
   * Hidratado en `hydrateUbicacionesDesdePivot`.
   */
  ubicaciones?: Relation<Ubicacion[]>;

  /**
  /**
   * Estado actual de la cuenta (activo, inactivo, bloqueado).
   */
  @Index('idx_usuario_status', ['status'])
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status!: UserStatus;

  /**
  /**
   * Idioma preferido del usuario para la interfaz y mensajes.
   */
  @Column({
    type: 'varchar',
    length: 5,
    default: UserLanguage.ES,
    nullable: true,
  })
  idioma!: UserLanguage;

  /**
  /**
   * Código OTP para la recuperación de contraseña.
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordOtp?: string | null;

  /**
  /**
   * Fecha de expiración del código OTP de recuperación.
   */
  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordOtpExpires?: Date | null;

  /**
  /**
   * Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión.
   */
  @Column({ type: 'boolean', default: false, name: 'must_change_password' })
  mustChangePassword!: boolean;

  /**
  /**
   * Pedidos a proveedores creados por este usuario.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Relation<Pedido[]>;

  /**
  /**
   * Recepciones de mercancía procesadas por este usuario.
   */
  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Relation<Recepcion[]>;

  /**
  /**
   * Movimientos de inventario generados por el usuario.
   */
  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Relation<Movimiento[]>;

  /**
  /**
   * Incidencias que han sido resueltas por este usuario.
   */
  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Relation<Incidencia[]>;

  /**
  /**
   * Archivos y documentos adjuntos subidos por el usuario.
   */
  @OneToMany(() => Archivo, (archivo) => archivo.usuario)
  archivos!: Relation<Archivo[]>;

  /**
  /**
   * Relación extendida con el perfil de profesor (si aplica).
   */
  @OneToOne(() => Profesor, (profesor) => profesor.user)
  profesor?: Relation<Profesor>;

  /**
  /**
   * Relación extendida con el perfil de alumno (si aplica).
   */
  @OneToOne(() => Alumno, (alumno) => alumno.user)
  alumno?: Relation<Alumno>;

  /**
  /**
   * Roles adicionales asignados al usuario para control RBAC dinámico.
   */
  @ManyToMany(() => Rol, (rol) => rol.usuarios, { cascade: true })
  @JoinTable({
    name: 'usuario_rol',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

  /**
  /**
   * Permisos concedidos explícitamente a este usuario más allá de sus roles.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosAdicionales)
  @JoinTable({
    name: 'usuario_permiso_adicional',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosAdicionales: Permiso[];

  /**
  /**
   * Permisos denegados explícitamente a este usuario incluso si sus roles los conceden.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosExcluidos)
  @JoinTable({
    name: 'usuario_permiso_excluido',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosExcluidos: Permiso[];

  /**
  /**
   * Indica si el registro está activo (soft delete indirecto).
   */
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /**
   * Preferencias del usuario en formato JSON (tutoriales vistos, configuraciones de UI, etc.)
   */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  preferences?: Record<string, any>;

  /**
  /**
   * Hook de TypeORM para hashear automáticamente la contraseña antes de guardar.
   */
  /**
   * Expone "hashPassword" en smart-economat-backend (Nest).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * Expone `ubicaciones[]` plano para respuestas/API legadas.
   */
  @AfterLoad()
  private hydrateUbicacionesDesdePivot(): void {
    if (!Array.isArray(this.usuarioUbicaciones)) {
      return;
    }
    this.ubicaciones = this.usuarioUbicaciones
      .map((row) => row.ubicacion)
      .filter((u): u is Ubicacion => Boolean(u?.id));
  }

  /**
  /**
   * Compara una contraseña en texto plano con el hash almacenado.
   * @param plainPassword Contraseña a validar.
   * @returns True si coinciden.
   */
  async validarPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export { rolUsuario as Rol };
