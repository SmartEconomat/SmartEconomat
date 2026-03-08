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
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { rolUsuario, UserStatus } from '../enums/usuario.enums';
import type { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import type { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { Permiso } from '../../permisos/entities/permiso.entity';

@Entity({ name: 'usuario' })
@Index('idx_usuario_username', ['username'])
@Index('idx_usuario_email', ['email'])
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

  /**
   * Rol del usuario que define sus permisos.
   * (ADMIN, PROFESOR, ALUMNO, etc.)
   * @type {rolUsuario}
   */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.ALUMNO })
  rol!: rolUsuario;

  @Index('idx_usuario_status', ['status'])
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status!: UserStatus;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires?: Date | null;

  @Column({ type: 'boolean', default: false, name: 'must_change_password' })
  mustChangePassword!: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];

  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Recepcion[];

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Movimiento[];

  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Incidencia[];

  @OneToOne('Profesor', 'user')
  profesor?: Relation<Profesor>;

  @OneToOne('Alumno', 'user')
  alumno?: Relation<Alumno>;

  @ManyToMany(() => Rol, (rol) => rol.usuarios)
  @JoinTable({
    name: 'usuario_rol',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

  /**
   * Permisos asignados directamente al usuario (además de los de sus roles)
   */
  @ManyToMany(() => Permiso)
  @JoinTable({
    name: 'usuario_permiso_adicional',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosAdicionales: Permiso[];

  /**
   * Permisos explícitamente revocados para este usuario (aunque sus roles los tengan)
   */
  @ManyToMany(() => Permiso)
  @JoinTable({
    name: 'usuario_permiso_excluido',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosExcluidos: Permiso[];

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validarPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export { rolUsuario as Rol };
