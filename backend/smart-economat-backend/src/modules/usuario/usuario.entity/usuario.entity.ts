import {
  Entity,
  Column,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import * as bcrypt from 'bcrypt';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { rolUsuario } from '../enums/usuario.enums';

@Entity({ name: 'usuario' })
@Index('idx_usuario_username', ['username'])
@Index('idx_usuario_email', ['email'])
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  /**
   * Rol del usuario que define sus permisos.
   * (ADMIN, PROFESOR, ALUMNO, etc.)
   * @type {rolUsuario}
   */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.INVITADO })
  rol!: rolUsuario;

  @Index('idx_usuario_activo', ['activo'])
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    name: 'cial_profesor',
  })
  cialProfesor?: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'numero_clase',
  })
  numeroClase?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  aula?: string;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];

  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Recepcion[];

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Movimiento[];

  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Incidencia[];

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
