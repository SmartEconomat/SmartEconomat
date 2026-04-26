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
 * Documentación en español.
 */
@Entity({ name: 'usuario' })
@Index(['username'])
@Index(['email'])
export class Usuario extends BaseEntity {
        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre?: string | null;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 100, select: false })
  password!: string;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

        /**
     * Documentación en español.
     */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.ALUMNO })
  rol!: rolUsuario;

        /**
     * Documentación en español.
     */
  @Index('idx_usuario_status', ['status'])
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status!: UserStatus;

        /**
     * Documentación en español.
     */
  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordOtp?: string | null;

        /**
     * Documentación en español.
     */
  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordOtpExpires?: Date | null;

        /**
     * Documentación en español.
     */
  @Column({ type: 'boolean', default: false, name: 'must_change_password' })
  mustChangePassword!: boolean;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Relation<Pedido[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Relation<Recepcion[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Relation<Movimiento[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Relation<Incidencia[]>;

        /**
     * Documentación en español.
     */
  @OneToMany(() => Archivo, (archivo) => archivo.usuario)
  archivos!: Relation<Archivo[]>;

        /**
     * Documentación en español.
     */
  @OneToOne(() => Profesor, (profesor) => profesor.user)
  profesor?: Relation<Profesor>;

        /**
     * Documentación en español.
     */
  @OneToOne(() => Alumno, (alumno) => alumno.user)
  alumno?: Relation<Alumno>;

        /**
     * Documentación en español.
     */
  @ManyToMany(() => Rol, (rol) => rol.usuarios, { cascade: true })
  @JoinTable({
    name: 'usuario_rol',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

        /**
     * Documentación en español.
     */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosAdicionales)
  @JoinTable({
    name: 'usuario_permiso_adicional',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosAdicionales: Permiso[];

        /**
     * Documentación en español.
     */
  @ManyToMany(() => Permiso, (permiso) => permiso.usuariosExcluidos)
  @JoinTable({
    name: 'usuario_permiso_excluido',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisosExcluidos: Permiso[];

        /**
     * Documentación en español.
     */
  @Column({ type: 'boolean', default: true })
  activo: boolean;

        /**
     * Documentación en español.
     */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

        /**
     * Documentación en español.
     */
  async validarPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export { rolUsuario as Rol };
