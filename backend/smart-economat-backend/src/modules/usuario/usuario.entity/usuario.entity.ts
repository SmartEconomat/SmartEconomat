import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
  type Relation,
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

@Entity({ name: 'usuario' })
@Index(['username'])
@Index(['email'])
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
  pedidos!: Relation<Pedido[]>;

  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Relation<Recepcion[]>;

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Relation<Movimiento[]>;

  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Relation<Incidencia[]>;

  @OneToMany(() => Archivo, (archivo) => archivo.usuario)
  archivos!: Relation<Archivo[]>;

  @OneToOne(() => Profesor, (profesor) => profesor.user)
  profesor?: Relation<Profesor>;

  @OneToOne(() => Alumno, (alumno) => alumno.user)
  alumno?: Relation<Alumno>;

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
