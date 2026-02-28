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
import { Exclude } from 'class-transformer';

/**
 * Entidad Usuario
 *
 * Representa un usuario del sistema con credenciales y rol.
 * Implementa encriptación de contraseña mediante hooks (BeforeInsert, BeforeUpdate).
 *
 * @class Usuario
 * @extends {BaseEntity}
 */
@Entity({ name: 'usuario' })
@Index('idx_usuario_username', ['username'])
@Index('idx_usuario_email', ['email'])
export class Usuario extends BaseEntity {
  /**
   * Nombre completo del usuario.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  /**
   * Nombre de usuario para login.
   * Único en el sistema.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  /**
   * Contraseña encriptada (hash).
   * Nunca se guarda en texto plano.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 100 })
  @Exclude()
  password!: string;

  /**
   * Correo electrónico de contacto.
   * Único en el sistema.
   * @type {string}
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  /**
   * Rol del usuario que define sus permisos.
   * (ADMIN, PROFESOR, ALUMNO, etc.)
   * @type {rolUsuario}
   */
  @Column({ type: 'enum', enum: rolUsuario, default: rolUsuario.INVITADO })
  rol!: rolUsuario;

  /**
   * Indica si el usuario puede acceder al sistema.
   * @type {boolean}
   */
  @Index('idx_usuario_activo', ['activo'])
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  /**
   * CIAL del profesor (Código de Identificación).
   * Específico para rol PROFESOR.
   * @type {string | undefined}
   */
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    name: 'cial_profesor',
  })
  cialProfesor?: string;

  /**
   * Número de clase asignado.
   * @type {string | undefined}
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'numero_clase',
  })
  numeroClase?: string;

  /**
   * Aula asignada.
   * @type {string | undefined}
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  aula?: string;

  /**
   * Pedidos realizados por este usuario.
   */
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];

  /**
   * Recepciones de pedidos gestionadas por este usuario.
   */
  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones!: Recepcion[];

  /**
   * Movimientos de inventario realizados por este usuario.
   */
  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos!: Movimiento[];

  /**
   * Incidencias que ha resuelto este usuario.
   */
  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Incidencia[];

  /* --- Hooks de Seguridad --- */

  /**
   * Hashear password antes de insertar/actualizar
   * - Solo hashea si password NO empieza con $2b$ (ya hasheado)
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /* --- Métodos de Dominio --- */

  /**
   * Validar password contra hash
   */
  async validarPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export { rolUsuario as Rol };
