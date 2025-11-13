import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { rol_usuario } from '../enums/usuario.enums';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id_usuario!: string;

  @Column({ type: 'varchar', length: 100, name: 'nombre', nullable: false })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'username',
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password', nullable: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: rol_usuario,
    name: 'rol',
    enumName: 'rol_usuario',
    default: rol_usuario.ADMINISTRADOR,
  })
  rol!: rol_usuario;

  @Column({ type: 'varchar', length: 150, name: 'email', nullable: false })
  email!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos?: Movimiento[];
}
